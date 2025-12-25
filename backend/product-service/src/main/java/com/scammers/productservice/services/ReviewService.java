package com.scammers.productservice.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scammers.productservice.models.OutboxEvent;
import com.scammers.productservice.models.Review;
import com.scammers.productservice.models.dtos.ShowReview;
import com.scammers.productservice.models.requests.ReviewCreateRequest;
import com.scammers.productservice.models.enums.EventType;
import com.scammers.productservice.models.enums.ReviewStatus;
import com.scammers.productservice.repositories.OutboxRepository;
import com.scammers.productservice.repositories.ProductRepository;
import com.scammers.productservice.repositories.ReviewRepository;
import jakarta.ws.rs.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository repository;
    private final OutboxRepository outboxRepo;
    private final ProductRepository productRepository;
    private final ObjectMapper om;

    @Transactional
    public Review saveReviewOnProduct(UUID productUUID, UUID userUUID, ReviewCreateRequest request) {
        short rating = request.mark();
        String text = request.text();

        if (rating < 1 || rating > 5) throw new IllegalArgumentException("Invalid rating");

        UUID sellerUUID = productRepository.getSellerUUID(productUUID);
        if (sellerUUID.equals(userUUID)) throw new AccessDeniedException("Вы не можете оценивать свой товар");

        Optional<Review> existingOpt = repository.findReviewByProductAndUser(productUUID, userUUID);

        Review r;
        boolean isNew = false;
        Short oldRating = null;
        String oldComment = null;

        if (existingOpt.isPresent()) {
            r = existingOpt.get();
            oldRating = r.getRating();
            oldComment = r.getComment();
        } else {
            isNew = true;
            r = new Review();
            r.setUserUUID(userUUID);
            r.setProductUUID(productUUID);
            r.setCreatedAt(Instant.now());
        }

        boolean ratingChanged = !isNew && !oldRating.equals(rating);
        boolean textChanged = !isNew && !Objects.equals(oldComment, text);

        if (!isNew && !ratingChanged && !textChanged) {
            return r;
        }

        r.setRating(rating);
        r.setComment(text);
        r.setReviewStatus(ReviewStatus.PENDING_PUB);
        r.setUpdatedAt(Instant.now());

        Review saved = repository.save(r);

        Map<String, Object> payload = new HashMap<>();
        payload.put("eventId", UUID.randomUUID().toString());
        payload.put("productId", productUUID.toString());
        payload.put("reviewId", saved.getId().toString());
        payload.put("userId", userUUID.toString());
        payload.put("reviewPendingStatus", ReviewStatus.PENDING_PUB.name());
        payload.put("timestamp", Instant.now().toString());

        EventType type;

        if (isNew) {
            type = EventType.CREATED;
            payload.put("rating", rating);
        } else {
            type = EventType.UPDATED;
            payload.put("oldRating", oldRating);
            payload.put("newRating", rating);
        }

        try {
            outboxRepo.save(OutboxEvent.of(productUUID, type, om.writeValueAsString(payload)));
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        return saved;
    }

    @Transactional
    public void initiateDeleteReview(UUID productUUID, UUID userUUID, boolean isAdmin) {
        Review r = repository.findReviewByProductAndUser(productUUID, userUUID)
                .orElseThrow(() -> new NotFoundException("Review not found for this product and user"));
        if (!r.getUserUUID().equals(userUUID) && !isAdmin) {
            throw new AccessDeniedException("Не владелец отзыва");
        }

        if (r.getReviewStatus() == ReviewStatus.PENDING_DEL || r.getReviewStatus() == ReviewStatus.DELETED) {
            return;
        }

        r.setReviewStatus(ReviewStatus.PENDING_DEL);
        r.setUpdatedAt(Instant.now());
        Review saved = repository.save(r);

        Map<String, Object> payload = Map.of(
                "eventId", UUID.randomUUID().toString(),
                "productId", r.getProductUUID().toString(),
                "reviewId", saved.getId(),
                "userId", r.getUserUUID().toString(),
                "rating", r.getRating(),
                "reviewPendingStatus", ReviewStatus.PENDING_DEL.name(),
                "timestamp", Instant.now().toString()
        );

        try {
            outboxRepo.save(OutboxEvent.of(
                    productUUID,
                    EventType.DELETED,
                    om.writeValueAsString(payload)
            ));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error creating outbox event", e);
        }
    }
    public List<ShowReview> getReviewsForProduct(UUID productUUID, int limit, int offset) {
        return repository.findReviewsForProduct(productUUID, limit, offset);
    }
}
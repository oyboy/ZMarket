package com.scammers.productservice.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scammers.productservice.models.OutboxEvent;
import com.scammers.productservice.models.Review;
import com.scammers.productservice.models.requests.ReviewCreateRequest;
import com.scammers.productservice.models.enums.EventType;
import com.scammers.productservice.models.enums.ReviewStatus;
import com.scammers.productservice.repositories.OutboxRepository;
import com.scammers.productservice.repositories.ReviewRepository;
import jakarta.ws.rs.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository repository;
    private final OutboxRepository outboxRepo;
    private final ObjectMapper om;

    @Transactional
    public Review saveReviewOnProduct(UUID productUUID, UUID userUUID, ReviewCreateRequest request) {
        short rating = request.mark();
        String text = request.text();
        if (rating < 1 || rating > 5) throw new IllegalArgumentException("Invalid rating");

        Review r = repository.findReviewByProductAndUser(productUUID, userUUID)
                .orElseGet(() -> {
                    Review nr = new Review();
                    nr.setUserUUID(userUUID);
                    nr.setProductUUID(productUUID);
                    nr.setRating(rating);
                    nr.setCreatedAt(Instant.now());
                    nr.setComment(text);
                    return nr;
                });
        Short oldRating = r.getId() == null ? null : r.getRating();
        r.setRating(rating);
        r.setComment(text);
        r.setReviewStatus(ReviewStatus.PENDING_PUB);
        r.setUpdatedAt(Instant.now());

        Review saved = repository.save(r);

        EventType type;
        Map<String, Object> payload = new HashMap<>();
        payload.put("eventId", UUID.randomUUID().toString());
        payload.put("productId", productUUID.toString());
        payload.put("reviewId", saved.getId().toString());
        payload.put("userId", userUUID.toString());
        payload.put("reviewPendingStatus",  ReviewStatus.PENDING_PUB.name());
        payload.put("timestamp", Instant.now().toString());

        if (oldRating == null) {
            type = EventType.CREATED;
            payload.put("rating", rating);
        } else if (!oldRating.equals(rating)) {
            type = EventType.UPDATED;
            payload.put("oldRating", oldRating);
            payload.put("newRating", rating);
        } else {
            type = EventType.UNTOUCHED;
        }
        if (type !=  EventType.UNTOUCHED) {
            try {
                outboxRepo.save(OutboxEvent.of(productUUID, type, om.writeValueAsString(payload)));
            } catch (JsonProcessingException e) {
                throw new RuntimeException(e);
            }
        }
        return saved;
    }

    @Transactional
    public void deleteReviewOnProduct(UUID reviewUUID, UUID productUUID, UUID userUUID) {
        Review r = repository.findReviewByProductAndUser(productUUID, userUUID)
                .orElseThrow(() -> new NotFoundException("Review not found"));
        if (!r.getProductUUID().equals(productUUID)) throw new IllegalArgumentException("mismatch product uuid");
        if (!r.getUserUUID().equals(userUUID)) throw new AccessDeniedException("not owner");

        r.setReviewStatus(ReviewStatus.PENDING_DEL);
        r.setUpdatedAt(Instant.now());
        repository.save(r);

        Map<String, Object> payload = Map.of(
                "eventId", UUID.randomUUID().toString(),
                "productId", productUUID.toString(),
                "reviewId", reviewUUID.toString(),
                "userId", userUUID.toString(),
                "rating", r.getRating(),
                "reviewPendingStatus",  ReviewStatus.PENDING_DEL.name(),
                "timestamp", Instant.now().toString()
        );
        try {
            outboxRepo.save(OutboxEvent.of(productUUID, EventType.DELETED, om.writeValueAsString(payload)));
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }
}
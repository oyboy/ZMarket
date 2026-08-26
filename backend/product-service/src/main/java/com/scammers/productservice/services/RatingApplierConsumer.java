package com.scammers.productservice.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scammers.productservice.models.RatingApplier;
import com.scammers.productservice.models.enums.ApplyStatus;
import com.scammers.productservice.models.enums.ReviewStatus;
import com.scammers.productservice.repositories.RatingApplierRepository;
import com.scammers.productservice.repositories.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RatingApplierConsumer {
    private static final String TOPIC_APPLY_REVIEW = "ratings-results";
    private static final String GROUP_ID = "product-service";
    private final ObjectMapper om;
    private final ReviewRepository reviewRepository;
    private final RatingApplierRepository ratingApplierRepository;

    @KafkaListener(
            topics = TOPIC_APPLY_REVIEW,
            groupId = GROUP_ID,
            containerFactory = "ratingsResultsStringKafkaListenerContainerFactory"
    )
    @Transactional
    public void listen(String message) {
        try {
            RatingApplier result = om.readValue(message, RatingApplier.class);

            boolean pendingPub = (result.getPendingStatus() == ReviewStatus.PENDING_PUB);

            int updated = (result.getStatus() == ApplyStatus.SUCCESS)
                    ? reviewRepository.finalizeSuccess(result.getProductUUID(), result.getUserUUID(), pendingPub)
                    : reviewRepository.finalizeFailed(result.getProductUUID(), result.getUserUUID());

            ratingApplierRepository.save(result);
        } catch (JsonProcessingException e) {
            System.err.println("JSON parse error: " + e.getMessage());
        }
    }
}
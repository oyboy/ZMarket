package com.scammers.reviewaggregateservice;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scammers.reviewaggregateservice.models.ProcessedEvent;
import com.scammers.reviewaggregateservice.models.RatingProjection;
import com.scammers.reviewaggregateservice.repositories.ProcessedEventRepository;
import com.scammers.reviewaggregateservice.repositories.RatingProjectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RatingsAggregator {
    private final ProcessedEventRepository processedRepo;
    private final RatingProjectionRepository projectionRepo;
    private final ObjectMapper om;

    @KafkaListener(
            topics = "reviews-events",
            groupId = "rating-agg-service"
    )

    @Transactional
    public void onEvent(String message) throws Exception {
        System.out.println("Accept message: " + message);
        JsonNode root = om.readTree(message);

        UUID eventId = UUID.fromString(root.get("id").asText());
        if (processedRepo.findById(eventId) != null)
            return;

        String type = root.get("type").asText();
        UUID productId = UUID.fromString(root.get("aggregate_id").asText());
        JsonNode payload = root.get("payload");

        switch (type) {
            case "CREATED" -> {
                int rating = payload.get("rating").asInt();
                projectionRepo.applyCreate(productId, rating);
            }

            case "UPDATED" -> {
                int oldR = payload.get("oldRating").asInt();
                int newR = payload.get("newRating").asInt();
                projectionRepo.applyUpdate(productId, oldR, newR);
            }

            case "DELETED" -> {
                int rating = payload.get("rating").asInt();
                projectionRepo.applyDelete(productId, rating);
            }
        }
        processedRepo.save(new ProcessedEvent(eventId));
    }

    public Optional<RatingProjection> getRatingProjection(UUID productId) {
        return projectionRepo.findByProductUuid(productId);
    }
}


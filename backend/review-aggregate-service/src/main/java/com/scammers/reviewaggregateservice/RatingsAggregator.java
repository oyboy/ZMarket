package com.scammers.reviewaggregateservice;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scammers.reviewaggregateservice.models.enums.ApplyStatus;
import com.scammers.reviewaggregateservice.models.ProcessedEvent;
import com.scammers.reviewaggregateservice.models.RatingApplier;
import com.scammers.reviewaggregateservice.models.RatingProjection;
import com.scammers.reviewaggregateservice.models.enums.PendingStatus;
import com.scammers.reviewaggregateservice.repositories.ProcessedEventRepository;
import com.scammers.reviewaggregateservice.repositories.RatingProjectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RatingsAggregator {
    private static final String RESULTS_TOPIC = "ratings-results";
    private final ProcessedEventRepository processedRepo;
    private final RatingProjectionRepository projectionRepo;
    private final ObjectMapper om;
    private final KafkaTemplate<String, String> kafka;

    @KafkaListener(
            topics = "reviews-events",
            groupId = "rating-agg-service"
    )

    @Transactional
    public void onEvent(String message) throws Exception {
        System.out.println("Accept message: " + message);
        JsonNode root = om.readTree(message);

        UUID eventId = UUID.fromString(root.get("id").asText());


        String type = root.get("type").asText();
        UUID productId = UUID.fromString(root.get("aggregate_id").asText());
        JsonNode payload = root.get("payload");

        UUID userId = UUID.fromString(payload.get("userId").asText());

        PendingStatus status = PendingStatus.valueOf(payload.get("reviewPendingStatus").asText());

        if (processedRepo.findById(eventId) != null) {
            //Переотправка для финализации
            sendResult(new RatingApplier(ApplyStatus.SUCCESS, status, eventId, productId, userId, null, Instant.now()));
            return;
        }

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

        sendResult(new RatingApplier(ApplyStatus.SUCCESS, status, eventId, productId, userId, null, Instant.now()));
    }

    private void sendResult(RatingApplier result) {
        try {
            String key = result.getProductUUID().toString();
            String json = om.writeValueAsString(result);
            kafka.send(RESULTS_TOPIC, key, json);
        } catch (Exception e) {
            System.err.println(e.getMessage());
        }
    }

    public Optional<RatingProjection> getRatingProjection(UUID productId) {
        return projectionRepo.findByProductUuid(productId);
    }
}
package com.scammers.reviewaggregateservice;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.scammers.reviewaggregateservice.models.ProcessedEvent;
import com.scammers.reviewaggregateservice.models.enums.PendingStatus;
import com.scammers.reviewaggregateservice.repositories.ProcessedEventRepository;
import com.scammers.reviewaggregateservice.repositories.RatingProjectionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RatingsAggregatorTest {

    @Mock
    private ProcessedEventRepository processedRepo;

    @Mock
    private RatingProjectionRepository projectionRepo;

    @Mock
    private KafkaTemplate<String, String> kafkaTemplate;

    @Spy
    private ObjectMapper om = new ObjectMapper().registerModule(new JavaTimeModule());

    @InjectMocks
    private RatingsAggregator aggregator;

    private final UUID eventId = UUID.randomUUID();
    private final UUID productId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();
    private final UUID aggregateId = productId;

    @Test
    void onEvent_Created_shouldCallApplyCreate() throws Exception {
        String json = createEventJson("CREATED", PendingStatus.PENDING_PUB.name(), 5, null, null);
        when(processedRepo.findById(eventId)).thenReturn(null);

        aggregator.onEvent(json);

        verify(projectionRepo).applyCreate(productId, 5);
        verify(processedRepo).save(any(ProcessedEvent.class));
        verify(kafkaTemplate).send(eq("ratings-results"), anyString(), anyString());
    }

    @Test
    void onEvent_Updated_shouldCallApplyUpdate() throws Exception {
        String json = createEventJson("UPDATED", PendingStatus.PENDING_PUB.name(), null, 5, 4);
        when(processedRepo.findById(eventId)).thenReturn(null);

        aggregator.onEvent(json);

        verify(projectionRepo).applyUpdate(productId, 4, 5);
        verify(processedRepo).save(any(ProcessedEvent.class));
    }

    @Test
    void onEvent_Deleted_shouldCallApplyDelete() throws Exception {
        String json = createEventJson("DELETED", PendingStatus.PENDING_DEL.name(), 3, null, null);
        when(processedRepo.findById(eventId)).thenReturn(null);

        aggregator.onEvent(json);

        verify(projectionRepo).applyDelete(productId, 3);
        verify(processedRepo).save(any(ProcessedEvent.class));
    }

    @Test
    void onEvent_Idempotency_shouldSkipProcessingIfAlreadyExists() throws Exception {
        String json = createEventJson("CREATED", PendingStatus.PENDING_PUB.name(), 5, null, null);
        when(processedRepo.findById(eventId)).thenReturn(new ProcessedEvent(eventId));

        aggregator.onEvent(json);

        verifyNoInteractions(projectionRepo);
        verify(processedRepo, never()).save(any());
        verify(kafkaTemplate).send(any(), any(), any());
    }

    private String createEventJson(String type, String pendingStatus, Integer rating, Integer newRating, Integer oldRating) {
        StringBuilder payloadBuilder = new StringBuilder();
        payloadBuilder.append(String.format("""
                "rating": %d,
                "userId": "%s",
                "eventId": "%s",
                "reviewId": "123",
                "productId": "%s",
                "timestamp": "2025-12-02T09:47:57.755901700Z",
                "reviewPendingStatus": "%s"
                """,
                rating != null ? rating : 0,
                userId,
                eventId,
                productId,
                pendingStatus
        ));

        if (newRating != null) {
            payloadBuilder.append(String.format(", \"newRating\": %d", newRating));
        }
        if (oldRating != null) {
            payloadBuilder.append(String.format(", \"oldRating\": %d", oldRating));
        }

        return String.format("""
            {
                "payload": {
                    %s
                },
                "id": "%s",
                "aggregate_id": "%s",
                "type": "%s"
            }
            """, payloadBuilder, UUID.randomUUID(), aggregateId, type);
    }
}
package com.scammers.reviewaggregateservice.models;

import com.scammers.reviewaggregateservice.models.enums.ApplyStatus;
import com.scammers.reviewaggregateservice.models.enums.PendingStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
public class RatingApplier {
    private ApplyStatus status;
    private PendingStatus pendingStatus;
    private UUID eventId;
    private UUID productUUID;
    private UUID userUUID;
    private String exitMessage;
    private Instant created_at;
}
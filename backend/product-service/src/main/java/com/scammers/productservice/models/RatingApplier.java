package com.scammers.productservice.models;

import com.scammers.productservice.models.enums.ApplyStatus;
import com.scammers.productservice.models.enums.ReviewStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
public class RatingApplier {
    private ApplyStatus status;
    private ReviewStatus pendingStatus;
    private UUID eventId;
    private UUID productUUID;
    private UUID userUUID;
    private String exitMessage;
    private Instant created_at;
}
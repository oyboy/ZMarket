package com.scammers.productservice.models.dtos;

import com.scammers.productservice.models.enums.ReviewStatus;

import java.time.Instant;
import java.util.UUID;

public record PendingReviewRow(
        long id,
        UUID productId,
        UUID userId,
        ReviewStatus status,
        Instant uploadedAt
) {}

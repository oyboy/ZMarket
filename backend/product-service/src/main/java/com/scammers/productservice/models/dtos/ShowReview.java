package com.scammers.productservice.models.dtos;

import java.time.Instant;
import java.util.UUID;

public record ShowReview(
        UUID userId,
        String text,
        Short rating,
        Instant updated_at
) {
}
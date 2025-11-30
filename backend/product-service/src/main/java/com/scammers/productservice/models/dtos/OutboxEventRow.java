package com.scammers.productservice.models.dtos;

import java.time.Instant;

public record OutboxEventRow(
        String type,
        String payload,
        Instant createdAt
) {}

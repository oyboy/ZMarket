package com.scammers.cartservice.models.responses;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductResponse(
        UUID sellerId,
        String title,
        BigDecimal price,
        Long stock
) {}

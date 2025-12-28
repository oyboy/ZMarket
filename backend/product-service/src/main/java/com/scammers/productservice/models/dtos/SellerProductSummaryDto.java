package com.scammers.productservice.models.dtos;

import java.time.Instant;
import java.util.UUID;

public record SellerProductSummaryDto(
        UUID productId,
        long ordersCount,
        long quantitySum,
        Instant lastOrderAt
) {}

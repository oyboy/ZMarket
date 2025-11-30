package com.scammers.warehouseservice.models.requests;

import java.util.UUID;

public record StockChangedEvent(
        UUID productId,
        Long availableQuantity
) {}
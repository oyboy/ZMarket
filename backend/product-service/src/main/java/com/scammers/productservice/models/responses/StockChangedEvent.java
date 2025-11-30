package com.scammers.productservice.models.responses;

import java.util.UUID;

public record StockChangedEvent(
        UUID productId,
        Long availableQuantity
) {}

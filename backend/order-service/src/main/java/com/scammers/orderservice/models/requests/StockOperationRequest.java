package com.scammers.orderservice.models.requests;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record StockOperationRequest(
        @NotNull UUID productId,
        @Min(1) int quantity,
        UUID orderId
) { }
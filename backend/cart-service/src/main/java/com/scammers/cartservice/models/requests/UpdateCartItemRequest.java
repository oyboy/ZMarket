package com.scammers.cartservice.models.requests;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record UpdateCartItemRequest(
        @NotNull
        UUID productId,
        @Min(0)
        int quantity
) {}

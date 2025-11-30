package com.scammers.cartservice.models.requests;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AddCartItemRequest(
        @NotNull(message = "ID продукта обязателен")
        UUID productId,

        @Min(value = 1, message = "Количество должно быть минимум 1")
        Integer quantity
) { }
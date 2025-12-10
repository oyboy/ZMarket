package com.scammers.orderservice.models.requests;

import jakarta.validation.constraints.NotBlank;

public record CreateOrderRequest(
        @NotBlank(message = "Адрес доставки обязателен")
        String deliveryAddress
) {}

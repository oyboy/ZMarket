package com.scammers.orderservice.models.kafka_events;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record PaymentSuccessEvent(@NotNull UUID orderId) {}
package com.scammers.orderservice.models.kafka_events;

import java.util.UUID;

public record PaymentFailedEvent(
        UUID orderId,
        String reason
) {}
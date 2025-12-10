package com.scammers.orderservice.models.kafka_events;

import com.scammers.orderservice.models.dtos.OrderItemDto;

import java.util.List;
import java.util.UUID;

public record OrderCancelledEvent(UUID orderId, List<OrderItemDto> items) {}

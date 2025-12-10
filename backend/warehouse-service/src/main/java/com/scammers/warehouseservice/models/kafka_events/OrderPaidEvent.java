package com.scammers.warehouseservice.models.kafka_events;

import com.scammers.warehouseservice.models.dtos.OrderItemDto;

import java.util.List;
import java.util.UUID;

public record OrderPaidEvent(UUID orderId, List<OrderItemDto> items) {}


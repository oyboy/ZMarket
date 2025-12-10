package com.scammers.warehouseservice.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scammers.warehouseservice.models.kafka_events.OrderCancelledEvent;
import com.scammers.warehouseservice.models.kafka_events.OrderPaidEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderListeners {
    private final WarehouseService warehouseService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "order-paid-events")
    public void onOrderPaid(String message) {
        try {
            OrderPaidEvent event = objectMapper.readValue(message, OrderPaidEvent.class);
            warehouseService.commitStockBatch(event.items(), event.orderId());
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize OrderPaidEvent: {}", message, e);
        }
    }

    @KafkaListener(topics = "order-cancelled-events")
    public void onOrderCancelled(String message) {
        try {
            OrderCancelledEvent event = objectMapper.readValue(message, OrderCancelledEvent.class);
            warehouseService.releaseStockBatch(event.items(), event.orderId());
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize OrderCancelledEvent: {}", message, e);
        }
    }
}

package com.scammers.orderservice.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scammers.orderservice.models.kafka_events.PaymentFailedEvent;
import com.scammers.orderservice.models.kafka_events.PaymentSuccessEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentEventListener {
    private final OrderService orderService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "payment-success-events", groupId = "order-service")
    public void onPaymentSuccess(String message) {
        try {
            PaymentSuccessEvent event = objectMapper.readValue(message, PaymentSuccessEvent.class);

            log.info("Payment received for order {}", event.orderId());
            orderService.confirmPayment(event.orderId());
        } catch (JsonProcessingException e) {
            log.error("Failed to parse PaymentSuccessEvent: {}", message, e);
        }
    }

    @KafkaListener(topics = "payment-failed-events", groupId = "order-service")
    public void onPaymentFailed(String message) {
        try {
            PaymentFailedEvent event = objectMapper.readValue(message, PaymentFailedEvent.class);

            log.info("Payment failed for order {}: {}", event.orderId(), event.reason());
            orderService.cancelOrder(event.orderId(), "Payment Failed: " + event.reason());
        } catch (JsonProcessingException e) {
            log.error("Failed to parse PaymentFailedEvent: {}", message, e);
        }
    }
}
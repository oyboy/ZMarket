package com.scammers.orderservice.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scammers.orderservice.models.kafka_events.PaymentFailedEvent;
import com.scammers.orderservice.models.kafka_events.PaymentSuccessEvent;
import com.scammers.orderservice.models.responses.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class MockPaymentController {
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @PostMapping("/{orderId}")
    public ApiResponse<Void> emulateSuccessPayment(@PathVariable UUID orderId) {
        PaymentSuccessEvent event = new PaymentSuccessEvent(orderId);
        try {
            String json = objectMapper.writeValueAsString(event);
            kafkaTemplate.send("payment-success-events", json);
        } catch (JsonProcessingException e) {
            System.err.println("Failed to send PaymentSuccessEvent: " + e.getMessage());
        }
        return ApiResponse.success("Событие отправлено");
    }

    @PostMapping("/{orderId}/fail")
    public ApiResponse<Void> emulateFailPayment(@PathVariable UUID orderId) {
        PaymentFailedEvent event = new PaymentFailedEvent(orderId, "Not enough money");
        try{
            String json = objectMapper.writeValueAsString(event);
            kafkaTemplate.send("payment-failed-events", json);
        }
        catch (JsonProcessingException e) {
            System.err.println("failed to serialize payment failed event: " +  e.getMessage());
        }
        return ApiResponse.success("Событие об ошибке оплаты отправлено");
    }
}

package com.scammers.orderservice.controllers;

import com.scammers.commonkafkaevents.PaymentFailedEvent;
import com.scammers.commonkafkaevents.PaymentSuccessEvent;
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

    @PostMapping("/{orderId}")
    public ApiResponse<Void> emulateSuccessPayment(@PathVariable UUID orderId) {
        PaymentSuccessEvent event = new PaymentSuccessEvent(orderId.toString());
        kafkaTemplate.send("payment-success-events", event);
        return ApiResponse.success("Событие отправлено");
    }

    @PostMapping("/{orderId}/fail")
    public ApiResponse<Void> emulateFailPayment(@PathVariable UUID orderId) {
        PaymentFailedEvent event = new PaymentFailedEvent(orderId.toString(), "Not enough money");
        kafkaTemplate.send("payment-failed-events", event);
        return ApiResponse.success("Событие об ошибке оплаты отправлено");
    }
}

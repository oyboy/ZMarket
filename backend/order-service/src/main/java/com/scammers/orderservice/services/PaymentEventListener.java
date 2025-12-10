package com.scammers.orderservice.services;

import com.scammers.commonkafkaevents.PaymentFailedEvent;
import com.scammers.commonkafkaevents.PaymentSuccessEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentEventListener {
    private final OrderService orderService;

    @KafkaListener(topics = "payment-success-events", groupId = "order-service")
    public void onPaymentSuccess(PaymentSuccessEvent event) {
        log.info("Payment received for order {}", event.getOrderId());
        orderService.confirmPayment(event.getOrderId());
    }

    @KafkaListener(topics = "payment-failed-events", groupId = "order-service")
    public void onPaymentFailed(PaymentFailedEvent event) {
        log.info("Payment failed for order {}: {}", event.getOrderId(), event.getReason());
        orderService.cancelOrder(event.getOrderId(), "Payment Failed: " + event.getReason());
    }
}
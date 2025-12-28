package com.scammers.recservice.services;

import com.scammers.commonkafkaevents.OrderPaidEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrdersEventsListener {

    private final RecommendationsStatsService statsService;

    @KafkaListener(
            topics = "order-paid-events",
            groupId = "recommendation-service"
    )
    @Transactional
    public void onOrderPaid(OrderPaidEvent event) {
        statsService.process(event);
    }
}
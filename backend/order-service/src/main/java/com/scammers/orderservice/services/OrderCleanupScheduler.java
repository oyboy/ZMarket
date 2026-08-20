package com.scammers.orderservice.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderCleanupScheduler {
    private final OrderCleanupService cleanupService;

    @Scheduled(fixedRate = 60000)
    public void cancelExpiredOrders() {
        cleanupService.cancelExpiredOrders();
    }
}

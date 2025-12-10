package com.scammers.orderservice.services;

import com.scammers.orderservice.enums.OrderStatus;
import com.scammers.orderservice.models.Order;
import com.scammers.orderservice.repositories.OrderRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderCleanupScheduler {
    private final OrderRepository orderRepository;
    private final OrderService orderService;

    @Scheduled(fixedRate = 60000) // 1 min
    @Transactional
    public void cancelExpiredOrders() {
        LocalDateTime now = LocalDateTime.now();

        List<Order> expiredOrders = orderRepository.findAllByStatusAndExpiresAtBefore(
                OrderStatus.PENDING_PAYMENT, now);
        if (!expiredOrders.isEmpty()) {
            log.info("Found {} expired orders", expiredOrders.size());
        }

        for (Order order : expiredOrders) {
            orderService.cancelOrder(order.getId().toString(), "Expired TTL");
        }
    }
}

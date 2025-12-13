package com.scammers.orderservice.repositories;

import com.scammers.orderservice.enums.OrderStatus;
import com.scammers.orderservice.models.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {
    List<Order> findAllByStatusAndExpiresAtBefore(OrderStatus status,  LocalDateTime now);
    List<Order> findAllByUserId(UUID userId);
}

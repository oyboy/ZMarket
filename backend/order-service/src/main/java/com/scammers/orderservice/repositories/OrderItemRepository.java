package com.scammers.orderservice.repositories;

import com.scammers.orderservice.models.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {
    @Query("SELECT oi FROM OrderItem oi JOIN FETCH oi.order WHERE oi.sellerId = :sellerId ORDER BY oi.order.createdAt DESC")
    List<OrderItem> findAllBySellerId(@Param("sellerId") UUID sellerId);
}

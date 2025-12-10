package com.scammers.orderservice.models;

import com.scammers.orderservice.enums.OrderStatus;
import com.scammers.orderservice.models.dtos.OrderDto;
import com.scammers.orderservice.models.dtos.OrderItemDto;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders", indexes = {
        @Index(name = "idx_order_user", columnList = "userId"),
        @Index(name = "idx_order_status_expires", columnList = "status, expiresAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    private BigDecimal totalPrice;

    private String deliveryAddress;

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime expiresAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items;
}
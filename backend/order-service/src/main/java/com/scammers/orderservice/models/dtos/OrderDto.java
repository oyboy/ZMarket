package com.scammers.orderservice.models.dtos;

import com.scammers.orderservice.enums.OrderStatus;
import lombok.*;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderDto {
    private UUID id;
    private UUID userId;
    private OrderStatus status;
    private BigDecimal totalPrice;
    private String deliveryAddress;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private List<OrderItemDto> items;
    //private String paymentUrl;
}

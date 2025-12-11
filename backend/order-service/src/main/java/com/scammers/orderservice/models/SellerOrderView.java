package com.scammers.orderservice.models;

import com.scammers.orderservice.enums.OrderStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class SellerOrderView {
    private UUID orderId;
    private LocalDateTime createdAt;
    private OrderStatus status;

    private UUID productId;
    private String productTitle;
    private Integer quantity;
    private BigDecimal price;
    private BigDecimal totalItemPrice;
    private String deliveryAddress;

    private String customerName;
    private String customerPhone;
    private String customerEmail;
}
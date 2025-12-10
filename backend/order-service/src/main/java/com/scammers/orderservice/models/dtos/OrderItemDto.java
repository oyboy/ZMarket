package com.scammers.orderservice.models.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderItemDto {
    private UUID productId;
    private String title;
    private Integer quantity;
    private BigDecimal price;

    public OrderItemDto(UUID productId, Integer quantity) {
        this.productId = productId;
        this.quantity = quantity;
    }
}
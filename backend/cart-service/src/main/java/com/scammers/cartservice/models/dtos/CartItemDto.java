package com.scammers.cartservice.models.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@AllArgsConstructor
public class CartItemDto {
    private UUID productId;
    private UUID sellerId;
    private String title;
    private BigDecimal price;
    private Integer quantity;
    private String imageUrl;
    private String sellerName;
}

package com.scammers.cartservice.models;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CartItemEntity implements Serializable {
    private UUID productId;
    private UUID sellerId;
    private Integer quantity;

    private String title;
    private BigDecimal price;
    private String imageUrl;
    private String sellerName;
}
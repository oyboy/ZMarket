package com.scammers.cartservice.models.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartDto {
    List<CartItemDto> cartItems;
    Integer totalItems;
    BigDecimal totalPrice;
}

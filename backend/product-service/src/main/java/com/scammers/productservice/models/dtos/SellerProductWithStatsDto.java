package com.scammers.productservice.models.dtos;

import com.scammers.productservice.models.Product;

import java.time.Instant;

public record SellerProductWithStatsDto(
        Product product,
        long ordersCount,
        long quantitySum,
        Instant lastOrderAt
) {}

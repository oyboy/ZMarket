package com.scammers.productservice.models.dtos;

import java.time.LocalDate;

public record DailySalesPointDto(
        LocalDate day,
        long ordersCount,
        long quantitySum
) {}
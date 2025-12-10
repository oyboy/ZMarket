package com.scammers.warehouseservice.models.dtos;

import com.scammers.warehouseservice.models.enums.TransactionType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class MovementDto {
    private UUID id;
    private Instant createdAt;
    private TransactionType type;
    private int quantity;
    private String note;
    private UUID orderId;
}
package com.scammers.commonkafkaevents;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemEventDto {
    private String productId;
    private String sellerId;
    private int quantity;
}
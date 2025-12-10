package com.scammers.commonkafkaevents;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockChangedEvent {
    private String productId;
    private long availableQuantity;
}
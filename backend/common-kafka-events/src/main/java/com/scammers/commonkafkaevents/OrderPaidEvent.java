package com.scammers.commonkafkaevents;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderPaidEvent {
    private String orderId;
    private UUID userId;
    private List<OrderItemEventDto> items;
}
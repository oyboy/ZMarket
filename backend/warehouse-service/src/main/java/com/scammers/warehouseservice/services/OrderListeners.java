package com.scammers.warehouseservice.services;

import com.scammers.commonkafkaevents.OrderCancelledEvent;
import com.scammers.commonkafkaevents.OrderPaidEvent;
import com.scammers.warehouseservice.models.dtos.OrderItemDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderListeners {
    private final WarehouseService warehouseService;
    @KafkaListener(topics = "order-paid-events")
    public void onOrderPaid(OrderPaidEvent event) {
        List<OrderItemDto> internalItems = event.getItems().stream()
                .map(i -> new OrderItemDto(
                        UUID.fromString(i.getProductId()),
                        (Integer) i.getQuantity()
                ))
                .toList();

        warehouseService.commitStockBatch(internalItems, event.getOrderId());
    }

    @KafkaListener(topics = "order-cancelled-events")
    public void onOrderCancelled(OrderCancelledEvent event) {
        List<OrderItemDto> internalItems = event.getItems().stream()
                .map(i -> new OrderItemDto(
                        UUID.fromString(i.getProductId()),
                        i.getQuantity()
                ))
                .toList();

        warehouseService.releaseStockBatch(internalItems, event.getOrderId());
    }
}

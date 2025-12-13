package com.scammers.productservice.services;

import com.scammers.commonkafkaevents.StockChangedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductStockListener {
    private final ProductService productService;

    @KafkaListener(topics = "stock-changed-events", groupId = "product-service-group")
    public void handleStockUpdate(StockChangedEvent event) {
        log.info("Received stock update for product {}: new stock {}", event.getProductId(), event.getAvailableQuantity());

        UUID productId = UUID.fromString(event.getProductId());

        productService.updateStockFromKafka(productId, event.getAvailableQuantity());
    }
}
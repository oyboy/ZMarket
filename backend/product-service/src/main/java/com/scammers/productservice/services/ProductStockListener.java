package com.scammers.productservice.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.scammers.productservice.configs.ObjectMapperFactory;
import com.scammers.productservice.models.responses.StockChangedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductStockListener {
    private final ProductService productService;

    @KafkaListener(topics = "stock-changed-events", groupId = "product-service-group")
    public void handleStockUpdate(String message) {
        try {
            StockChangedEvent event = ObjectMapperFactory.create().readValue(message, StockChangedEvent.class);
            log.info("Received stock update for product {}: new stock {}", event.productId(), event.availableQuantity());

            productService.updateStockFromKafka(event.productId(), event.availableQuantity());
        } catch (JsonProcessingException e) {
            log.error(e.getMessage());
        }
        catch (Exception e) {
            log.error("Failed to update stock for product");
        }
    }
}
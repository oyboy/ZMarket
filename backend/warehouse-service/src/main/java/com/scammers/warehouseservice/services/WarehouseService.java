package com.scammers.warehouseservice.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scammers.warehouseservice.models.StockTransactions;
import com.scammers.warehouseservice.models.WarehouseItem;
import com.scammers.warehouseservice.models.enums.TransactionType;
import com.scammers.warehouseservice.models.requests.StockChangedEvent;
import com.scammers.warehouseservice.repositories.StockTransactionRepository;
import com.scammers.warehouseservice.repositories.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WarehouseService {
    private final WarehouseRepository repository;
    private final StockTransactionRepository transactionRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    private static final String TOPIC_STOCK = "stock-changed-events";

    private void sendStockEvent(UUID productId) {
        repository.findByProductId(productId).ifPresent(item -> {
            long available = item.getQuantityOnHand() - item.getQuantityReserved();

            StockChangedEvent event = new StockChangedEvent(productId, available);

            try {
                String jsonMessage = objectMapper.writeValueAsString(event);
                kafkaTemplate.send(TOPIC_STOCK, productId.toString(), jsonMessage);

            } catch (JsonProcessingException e) {
                log.error("Ошибка сериализации JSON: {}", e.getMessage());
            }
        });
    }

    @Transactional
    public void addStock(UUID productId, int quantity) {
        if (quantity <= 0) throw new IllegalArgumentException("Количество должно быть > 0");

        WarehouseItem item = repository.findByProductId(productId)
                .orElseGet(() -> WarehouseItem.builder()
                        .productId(productId)
                        .quantityOnHand(0)
                        .quantityReserved(0)
                        .build());

        item.setQuantityOnHand(item.getQuantityOnHand() + quantity);
        repository.save(item);

        saveTransaction(productId, quantity, TransactionType.INBOUND, null, "Поставка товара");
        log.info("Added {} items for product {}", quantity, productId);
        sendStockEvent(productId);
    }

    @Transactional
    public boolean reserveStock(UUID productId, int quantity, UUID orderId) {
        int updatedRows = repository.reserveStock(productId, quantity);

        if (updatedRows > 0) {
            saveTransaction(productId, quantity, TransactionType.RESERVE, orderId, "Резерв под заказ");
            log.info("Reserved {} items for order {}", quantity, orderId);
            sendStockEvent(productId);
            return true;
        } else {
            log.warn("Failed to reserve {} items for product {}", quantity, productId);
            return false;
        }
    }

    @Transactional
    public void commitStock(UUID productId, int quantity, UUID orderId) {
        repository.commitStock(productId, quantity);
        saveTransaction(productId, quantity, TransactionType.COMMIT, orderId, "Заказ оплачен");
        log.info("Committed {} items for order {}", quantity, orderId);
        sendStockEvent(productId);
    }

    @Transactional
    public void releaseStock(UUID productId, int quantity, UUID orderId) {
        repository.releaseStock(productId, quantity);
        saveTransaction(productId, quantity, TransactionType.RELEASE, orderId, "Отмена резерва");
        log.info("Released {} items for order {}", quantity, orderId);
        sendStockEvent(productId);
    }

    @Transactional(readOnly = true)
    public Integer getAvailableQuantity(UUID productId) {
        return repository.findByProductId(productId)
                .map(item -> item.getQuantityOnHand() - item.getQuantityReserved())
                .orElse(0);
    }

    private void saveTransaction(UUID pId, int qty, TransactionType type, UUID orderId, String note) {
        StockTransactions transaction = StockTransactions.builder()
                .productId(pId)
                .quantity(qty)
                .transactionType(type)
                .orderId(orderId)
                .note(note)
                .createdAt(Instant.now())
                .build();
        transactionRepository.save(transaction);
    }
}
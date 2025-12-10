package com.scammers.warehouseservice.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scammers.warehouseservice.models.StockTransactions;
import com.scammers.warehouseservice.models.WarehouseItem;
import com.scammers.warehouseservice.models.dtos.OrderItemDto;
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
import java.util.*;
import java.util.stream.Collectors;

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
    private void sendStockEventsBatch(Set<UUID> productIds) {
        if (productIds.isEmpty()) return;
        List<WarehouseItem> items = repository.findAllByProductIdIn(productIds);

        for (WarehouseItem item : items) {
            long available = item.getQuantityOnHand() - item.getQuantityReserved();
            StockChangedEvent event = new StockChangedEvent(item.getProductId(), available);

            try {
                String jsonMessage = objectMapper.writeValueAsString(event);
                kafkaTemplate.send(TOPIC_STOCK, item.getProductId().toString(), jsonMessage);
            } catch (JsonProcessingException e) {
                log.error("Ошибка сериализации JSON: {}", e.getMessage());
            }
        }
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

    @Transactional
    public void commitStockBatch(List<OrderItemDto> items, UUID orderId) {
        Map<UUID, Integer> batch = items.stream()
                .collect(Collectors.toMap(
                        OrderItemDto::getProductId,
                        OrderItemDto::getQuantity,
                        Integer::sum
                ));

        UUID[] ids = batch.keySet().toArray(new UUID[0]);
        Integer[] qty = batch.values().toArray(new Integer[0]);

        repository.commitStockBatch(ids, qty);
        saveTransactions(items, TransactionType.COMMIT, orderId, "Заказ оплачен");
        sendStockEventsBatch(batch.keySet());
    }

    @Transactional
    public void releaseStockBatch(List<OrderItemDto> items, UUID orderId) {
        Map<UUID, Integer> batch = items.stream()
                .collect(Collectors.toMap(
                        OrderItemDto::getProductId,
                        OrderItemDto::getQuantity,
                        Integer::sum
                ));

        UUID[] ids = batch.keySet().toArray(new UUID[0]);
        Integer[] qty = batch.values().toArray(new Integer[0]);

        repository.releaseStockBatch(ids, qty);
        saveTransactions(items, TransactionType.RELEASE, orderId, "Отмена резерва");
        sendStockEventsBatch(batch.keySet());
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

    private void saveTransactions(
            List<OrderItemDto> items,
            TransactionType type,
            UUID orderId,
            String note
    ) {
        List<StockTransactions> tx = items.stream()
                .map(i -> StockTransactions.builder()
                        .productId(i.getProductId())
                        .quantity(i.getQuantity())
                        .transactionType(type)
                        .orderId(orderId)
                        .note(note)
                        .createdAt(Instant.now())
                        .build()
                )
                .toList();

        transactionRepository.saveAll(tx);
    }
}
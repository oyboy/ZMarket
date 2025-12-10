package com.scammers.warehouseservice.services;

import com.scammers.commonkafkaevents.StockChangedEvent;
import com.scammers.warehouseservice.models.StockTransactions;
import com.scammers.warehouseservice.models.WarehouseItem;
import com.scammers.warehouseservice.models.dtos.MovementDto;
import com.scammers.warehouseservice.models.dtos.OrderItemDto;
import com.scammers.warehouseservice.models.enums.TransactionType;
import com.scammers.warehouseservice.repositories.StockTransactionRepository;
import com.scammers.warehouseservice.repositories.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
    private final KafkaTemplate<String, Object> kafkaTemplate;

    private static final String TOPIC_STOCK = "stock-changed-events";

    private void sendStockEvent(UUID productId) {
        repository.findByProductId(productId).ifPresent(item -> {
            long available = item.getQuantityOnHand() - item.getQuantityReserved();
            StockChangedEvent event = new StockChangedEvent(productId.toString(), available);

            kafkaTemplate.send(TOPIC_STOCK, productId.toString(), event);
        });
    }

    private void sendStockEventsBatch(Set<UUID> productIds) {
        if (productIds.isEmpty()) return;
        List<WarehouseItem> items = repository.findAllByProductIdIn(productIds);

        for (WarehouseItem item : items) {
            long available = item.getQuantityOnHand() - item.getQuantityReserved();
            StockChangedEvent event = new StockChangedEvent(item.getProductId().toString(), available);

            kafkaTemplate.send(TOPIC_STOCK, item.getProductId().toString(), event);
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
    public void removeStock(UUID productId, int quantity) {
        if (quantity <= 0) throw new IllegalArgumentException("Quantity must be > 0");

        WarehouseItem item = repository.findByProductId(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        if (item.getQuantityOnHand() < quantity) {
            throw new IllegalArgumentException("Not enough stock to remove");
        }

        item.setQuantityOnHand(item.getQuantityOnHand() - quantity);
        repository.save(item);

        saveTransaction(productId, quantity, TransactionType.OUTBOUND, null, "Списание продавцом");
        sendStockEvent(productId);
    }

    @Transactional
    public void setStock(UUID productId, int quantity) {
        if (quantity < 0) throw new IllegalArgumentException("Quantity cannot be negative");

        WarehouseItem item = repository.findByProductId(productId)
                .orElseGet(() -> WarehouseItem.builder()
                        .productId(productId)
                        .quantityOnHand(0)
                        .quantityReserved(0)
                        .build());

        int diff = quantity - item.getQuantityOnHand();
        item.setQuantityOnHand(quantity);
        repository.save(item);

        saveTransaction(productId, Math.abs(diff), TransactionType.ADJUSTMENT, null, "Корректировка остатка");
        sendStockEvent(productId);
    }

    @Transactional(readOnly = true)
    public List<MovementDto> getMovements(UUID productId, int limit, int offset) {
        int pageNumber = limit > 0 ? offset / limit : 0;
        Pageable pageable = PageRequest.of(pageNumber, limit, Sort.by("createdAt").descending());

        return transactionRepository.findAllByProductId(productId, pageable)
                .stream()
                .map(tx -> MovementDto.builder()
                        .id(tx.getId())
                        .createdAt(tx.getCreatedAt())
                        .type(tx.getTransactionType())
                        .quantity(tx.getQuantity())
                        .note(tx.getNote())
                        .orderId(tx.getOrderId())
                        .build())
                .toList();
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
    public void commitStockBatch(List<OrderItemDto> items, String orderId) {
        Map<UUID, Integer> batch = items.stream()
                .collect(Collectors.toMap(
                        OrderItemDto::getProductId,
                        OrderItemDto::getQuantity,
                        Integer::sum
                ));

        UUID[] ids = batch.keySet().toArray(new UUID[0]);
        Integer[] qty = batch.values().toArray(new Integer[0]);

        repository.commitStockBatch(ids, qty);
        saveTransactions(items, TransactionType.COMMIT, UUID.fromString(orderId), "Заказ оплачен");
        sendStockEventsBatch(batch.keySet());
    }

    @Transactional
    public void releaseStockBatch(List<OrderItemDto> items, String orderId) {
        Map<UUID, Integer> batch = items.stream()
                .collect(Collectors.toMap(
                        OrderItemDto::getProductId,
                        OrderItemDto::getQuantity,
                        Integer::sum
                ));

        UUID[] ids = batch.keySet().toArray(new UUID[0]);
        Integer[] qty = batch.values().toArray(new Integer[0]);

        repository.releaseStockBatch(ids, qty);
        saveTransactions(items, TransactionType.RELEASE, UUID.fromString(orderId), "Отмена резерва");
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
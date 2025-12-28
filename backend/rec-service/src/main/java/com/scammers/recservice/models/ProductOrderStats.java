package com.scammers.recservice.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "product_order_stats",
        indexes = {
                @Index(name = "idx_pos_popularity", columnList = "orders_cnt DESC, last_order_at DESC"),
                @Index(name = "idx_pos_category", columnList = "category_id, manufacturer_uuid, orders_cnt DESC")
        })
@Getter
@Setter
public class ProductOrderStats {
    @Id
    @Column(name = "product_uuid", nullable = false)
    private UUID productUuid;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Column(name = "manufacturer_uuid", nullable = false)
    private UUID manufacturerUuid;

    @Column(name = "orders_cnt", nullable = false)
    private long ordersCnt = 0;

    @Column(name = "quantity_sum", nullable = false)
    private long quantitySum = 0;

    @Column(name = "last_order_at", nullable = false)
    private Instant lastOrderAt = Instant.now();
}
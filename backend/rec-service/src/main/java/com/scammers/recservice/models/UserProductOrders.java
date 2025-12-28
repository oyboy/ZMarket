package com.scammers.recservice.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_product_orders",
        indexes = @Index(name = "idx_user_prod_last", columnList = "user_uuid, last_order_at DESC"))
@Getter
@Setter
public class UserProductOrders {
    @EmbeddedId
    private UserProductOrdersId id;

    @Column(name = "orders_cnt", nullable = false)
    private long ordersCnt = 0;

    @Column(name = "last_order_at", nullable = false)
    private Instant lastOrderAt = Instant.now();

    @Embeddable
    @Getter
    @Setter
    public static class UserProductOrdersId implements Serializable {
        @Column(name = "user_uuid", nullable = false)
        private UUID userUuid;

        @Column(name = "product_uuid", nullable = false)
        private UUID productUuid;
    }
}

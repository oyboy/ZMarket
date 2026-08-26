package com.scammers.recservice.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_order_profile",
        indexes = @Index(name = "idx_uop_main", columnList = "user_uuid, orders_cnt DESC, last_order_at DESC"))
@Getter
@Setter
public class UserOrderProfile {
    @EmbeddedId
    private UserOrderProfileId id;

    @Column(name = "orders_cnt", nullable = false)
    private long ordersCnt = 0;

    @Column(name = "last_order_at", nullable = false)
    private Instant lastOrderAt = Instant.now();

    @Embeddable
    @Getter
    @Setter
    public static class UserOrderProfileId implements Serializable {
        @Column(name = "user_uuid", nullable = false)
        private UUID userUuid;

        @Column(name = "category_id", nullable = false)
        private Long categoryId;

        @Column(name = "manufacturer_uuid", nullable = false)
        private UUID manufacturerUuid;
    }
}

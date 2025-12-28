package com.scammers.recservice.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "seller_product_daily_stats",
        indexes = @Index(name = "idx_spds_seller_day", columnList = "sellerUuid, day"))
@Getter
@Setter
public class SellerProductDailyStats {
    @EmbeddedId
    private Id id;

    @Column(name = "orders_cnt", nullable = false)
    private long ordersCnt = 0;

    @Column(name = "quantity_sum", nullable = false)
    private long quantitySum = 0;

    @Embeddable
    @Getter @Setter
    public static class Id implements Serializable {
        @Column(name = "seller_uuid", nullable = false)
        private UUID sellerUuid;

        @Column(name = "product_uuid", nullable = false)
        private UUID productUuid;

        @Column(name = "day", nullable = false)
        private LocalDate day;
    }
}

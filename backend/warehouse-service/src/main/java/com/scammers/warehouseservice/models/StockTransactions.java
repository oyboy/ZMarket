package com.scammers.warehouseservice.models;

import com.scammers.warehouseservice.models.enums.TransactionType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StockTransactions {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID productId;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TransactionType transactionType;

    @Column(nullable = false)
    private int quantity;

    private UUID orderId;

    private String note;

    @CreationTimestamp
    private Instant createdAt;
}

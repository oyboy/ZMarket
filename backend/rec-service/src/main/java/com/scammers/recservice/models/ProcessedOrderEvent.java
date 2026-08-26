package com.scammers.recservice.models;

import jakarta.persistence.*;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "processed_order_events",
        indexes = @Index(name = "idx_poe_time", columnList = "processed_at"))
@NoArgsConstructor
public class ProcessedOrderEvent {
    @Id
    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @Column(name = "processed_at", nullable = false)
    private Instant processedAt;

    public ProcessedOrderEvent(UUID eventId) {
        this.eventId = eventId;
        processedAt = Instant.now();
    }
}
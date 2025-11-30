package com.scammers.productservice.models;

import com.scammers.productservice.models.enums.EventType;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class OutboxEvent {
    private UUID id;
    private UUID aggregateId;
    private String aggregateType;
    private String type;
    private String payload;
    private Instant createdAt;

    public static OutboxEvent of(UUID aggregateId, EventType type, String payload) {
        OutboxEvent e = new OutboxEvent();
        e.id = UUID.randomUUID();
        e.aggregateId = aggregateId;
        e.aggregateType = "review";
        e.type = type.name();
        e.payload = payload;
        e.createdAt = Instant.now();
        return e;
    }
}
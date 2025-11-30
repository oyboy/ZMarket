package com.scammers.reviewaggregateservice.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
public class ProcessedEvent {
    private UUID event_uuid;
    private Instant processed_at;

    public ProcessedEvent(UUID event_uuid) {
        this.event_uuid = event_uuid;
        processed_at = Instant.now();
    }
}

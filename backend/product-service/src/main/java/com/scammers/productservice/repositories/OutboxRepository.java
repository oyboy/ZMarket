package com.scammers.productservice.repositories;

import com.scammers.productservice.models.OutboxEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.sql.Types;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class OutboxRepository {
    private final JdbcTemplate jdbcTemplate;

    public OutboxEvent save(OutboxEvent event) {
        System.out.println("Event: " + event);
        String command = "INSERT INTO outbox (id, aggregate_id, aggregate_type, \"type\", payload, created_at) " +
                "VALUES (?, ?, ?, ?, ?::jsonb, ?)";

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(command);
            ps.setObject(1, event.getId(), Types.OTHER);
            ps.setObject(2, event.getAggregateId(), Types.OTHER);
            ps.setString(3, event.getAggregateType());
            ps.setString(4, event.getType());
            ps.setString(5, event.getPayload());
            ps.setTimestamp(6, Timestamp.from(event.getCreatedAt()));
            return ps;
        });

        return event;
    }
}
package com.scammers.productservice.repositories;

import com.scammers.productservice.models.OutboxEvent;
import com.scammers.productservice.models.dtos.OutboxEventRow;
import com.scammers.productservice.models.enums.ReviewStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
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

    public Optional<OutboxEventRow> findLatestFor(UUID productId, UUID userId, ReviewStatus pendingStatus) {
        String sql = """
                SELECT type, payload::text AS payload, created_at
                FROM outbox
                WHERE aggregate_id = ?
                  AND payload->>'productId' = ?
                  AND payload->>'userId' = ?
                  AND payload->>'reviewPendingStatus' = ?
                ORDER BY created_at DESC
                LIMIT 1
                """;
        return jdbcTemplate.query(sql,
                ps -> {
                    ps.setObject(1, productId, Types.OTHER);
                    ps.setString(2, productId.toString());
                    ps.setString(3, userId.toString());
                    ps.setString(4, pendingStatus.name());
                },
                rs -> {
                    if (rs.next()) {
                        String type = rs.getString("type");
                        String payload = rs.getString("payload");
                        Instant createdAt = rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toInstant() : null;
                        return Optional.of(new OutboxEventRow(type, payload, createdAt));
                    }
                    return Optional.empty();
                }
        );
    }

    public boolean hasRecentFor(UUID productId, UUID userId, ReviewStatus pendingStatus, Duration cooldown) {
        Instant cutoff = Instant.now().minus(cooldown);
        String sql = """
                SELECT 1
                FROM outbox
                WHERE aggregate_id = ?
                  AND payload->>'productId' = ?
                  AND payload->>'userId' = ?
                  AND payload->>'reviewPendingStatus' = ?
                  AND created_at > ?
                LIMIT 1
                """;
        Integer exists = jdbcTemplate.query(sql,
                ps -> {
                    ps.setObject(1, productId, Types.OTHER);
                    ps.setString(2, productId.toString());
                    ps.setString(3, userId.toString());
                    ps.setString(4, pendingStatus.name());
                    ps.setTimestamp(5, Timestamp.from(cutoff));
                },
                rs -> rs.next() ? 1 : null
        );
        return exists != null;
    }

    public void insertOutbox(UUID aggregateId, String type, String payloadJson) {
        String sql = """
                INSERT INTO outbox (id, aggregate_id, aggregate_type, type, payload, created_at)
                VALUES (?, ?, 'review', ?, ?::jsonb, NOW())
                """;
        jdbcTemplate.update(sql,
                UUID.randomUUID(),
                aggregateId,
                type,
                payloadJson
        );
    }
}
package com.scammers.productservice.repositories;

import com.scammers.productservice.components.RatingApplierRowMapper;
import com.scammers.productservice.models.RatingApplier;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.sql.Types;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class RatingApplierRepository {
    private final JdbcTemplate jdbcTemplate;
    private final RatingApplierRowMapper rowMapper;

    public Optional<RatingApplier> findByEventId(UUID eventId) {
        String sql = """
                SELECT event_id, status, pending_status, product_uuid, user_uuid, exit_message, created_at 
                FROM rating_applier_status 
                WHERE event_id = ?
                """;
        try {
            RatingApplier applier = jdbcTemplate.queryForObject(sql, rowMapper, eventId);
            return Optional.ofNullable(applier);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public void save(RatingApplier applier) {
        String sql = """
                INSERT INTO rating_applier_status (event_id, status, pending_status, product_uuid, user_uuid, exit_message, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (event_id) DO UPDATE SET
                    status = EXCLUDED.status,
                    pending_status = EXCLUDED.pending_status,
                    exit_message = EXCLUDED.exit_message,
                    created_at = EXCLUDED.created_at
                """;
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql);
            ps.setObject(1, applier.getEventId(), Types.OTHER);
            ps.setString(2, applier.getStatus().name());
            ps.setString(3, applier.getPendingStatus().name());
            ps.setObject(4, applier.getProductUUID(), Types.OTHER);
            ps.setObject(5, applier.getUserUUID(), Types.OTHER);
            ps.setString(6, applier.getExitMessage());
            ps.setTimestamp(7, Timestamp.from(applier.getCreated_at()));
            return ps;
        });
    }
}

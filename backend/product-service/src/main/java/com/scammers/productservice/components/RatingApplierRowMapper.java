package com.scammers.productservice.components;

import com.scammers.productservice.models.RatingApplier;
import com.scammers.productservice.models.enums.ApplyStatus;
import com.scammers.productservice.models.enums.ReviewStatus;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.UUID;

@Component
public class RatingApplierRowMapper implements RowMapper<RatingApplier> {
    @Override
    public RatingApplier mapRow(ResultSet rs, int rowNum) throws SQLException {
        ApplyStatus status = ApplyStatus.valueOf(rs.getString("status").toUpperCase());
        ReviewStatus pendingStatus = ReviewStatus.valueOf(rs.getString("pending_status").toUpperCase());
        UUID eventId = (UUID) rs.getObject("event_id");
        UUID productUUID = (UUID) rs.getObject("product_uuid");
        UUID userUUID = (UUID) rs.getObject("user_uuid");
        String exitMessage = rs.getString("exit_message");
        Instant createdAt = rs.getTimestamp("created_at").toInstant();

        return new RatingApplier(
                status,
                pendingStatus,
                eventId,
                productUUID,
                userUUID,
                exitMessage,
                createdAt
        );
    }
}

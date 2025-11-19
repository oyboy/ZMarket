package com.scammers.reviewaggregateservice.components;

import com.scammers.reviewaggregateservice.models.ProcessedEvent;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.UUID;

@Component
public class EventRowMapper implements RowMapper<ProcessedEvent> {
    @Override
    public ProcessedEvent mapRow(ResultSet rs, int rowNum) throws SQLException {
        UUID event_uuid = UUID.fromString((rs.getString("event_id").toUpperCase()));
        Instant processed_at =  rs.getTimestamp("created_at").toInstant();

        return new ProcessedEvent(
                event_uuid,
                processed_at
        );
    }
}

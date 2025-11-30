package com.scammers.reviewaggregateservice.repositories;

import com.scammers.reviewaggregateservice.models.ProcessedEvent;
import com.scammers.reviewaggregateservice.components.EventRowMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.support.DataAccessUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.sql.Types;
import java.util.List;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class ProcessedEventRepository {
    private final JdbcTemplate jdbcTemplate;
    private final EventRowMapper eventRowMapper;

    public ProcessedEvent findById(UUID id) {
        String command = "SELECT * FROM processed_events WHERE event_id = ?";
        List<ProcessedEvent> evs = jdbcTemplate.query(command, eventRowMapper, id);
        return DataAccessUtils.singleResult(evs);
    }

    public void save(ProcessedEvent ev) {
        String command = "INSERT INTO processed_events (event_id, processed_at) VALUES (?, ?)";
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(command);
            ps.setObject(1, ev.getEvent_uuid(), Types.OTHER);
            ps.setTimestamp(2, Timestamp.from(ev.getProcessed_at()));
            return ps;
        });
    }
}

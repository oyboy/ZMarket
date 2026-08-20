package com.scammers.reviewaggregateservice;

import com.scammers.reviewaggregateservice.components.RatingProjectionRowMapper;
import com.scammers.reviewaggregateservice.repositories.RatingProjectionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.JdbcTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.testcontainers.containers.PostgreSQLContainer;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

@JdbcTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({RatingProjectionRepository.class, RatingProjectionRowMapper.class})
class RatingProjectionRepositoryTest {
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15");

    static {
        postgres.start();
    }

    @Autowired
    private RatingProjectionRepository repository;

    private final UUID productId = UUID.randomUUID();

    @Test
    void applyCreate_shouldInsertNewRecord() {
        repository.applyCreate(productId, 5);

        var result = repository.findByProductUuid(productId).orElseThrow();

        assertEquals(1, result.getCnt());
        assertEquals(5, result.getSum());
        assertEquals(5.0, result.getAvg().doubleValue());
        assertEquals(1, result.getB5());
        assertEquals(0, result.getB1());
    }

    @Test
    void applyCreate_shouldUpdateExisting_OnConflict() {
        repository.applyCreate(productId, 5);

        repository.applyCreate(productId, 1);

        var result = repository.findByProductUuid(productId).orElseThrow();

        assertEquals(2, result.getCnt());
        assertEquals(6, result.getSum());
        assertEquals(3.0, result.getAvg().doubleValue());
        assertEquals(1, result.getB5());
        assertEquals(1, result.getB1());
    }

    @Test
    void applyUpdate_shouldShiftBucketsAndRecalculateAvg() {
        repository.applyCreate(productId, 5);
        repository.applyCreate(productId, 5);

        repository.applyUpdate(productId, 5, 3);

        var result = repository.findByProductUuid(productId).orElseThrow();

        assertEquals(2, result.getCnt());
        assertEquals(8, result.getSum());
        assertEquals(4.0, result.getAvg().doubleValue());
        assertEquals(1, result.getB5());
        assertEquals(1, result.getB3());
    }

    @Test
    void applyDelete_shouldDecreaseCount() {
        repository.applyCreate(productId, 5);
        repository.applyCreate(productId, 4);

        repository.applyDelete(productId, 4);

        var result = repository.findByProductUuid(productId).orElseThrow();

        assertEquals(1, result.getCnt());
        assertEquals(5, result.getSum());
        assertEquals(5.0, result.getAvg().doubleValue());
        assertEquals(1, result.getB5());
        assertEquals(0, result.getB4());
    }
}
package com.scammers.productservice.repositories;

import com.scammers.productservice.components.ReviewRowMapper;
import com.scammers.productservice.models.Review;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.support.DataAccessUtils;
import org.springframework.jdbc.BadSqlGrammarException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.sql.Types;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class ReviewRepository {
    private final JdbcTemplate jdbcTemplate;
    private final ReviewRowMapper reviewRowMapper;

    public Optional<Review> findReviewByProductAndUser(UUID productUUID, UUID userUUID) {
        String command = "SELECT * FROM product_reviews WHERE product_id = ? AND user_id = ?";
        List<Review> products = jdbcTemplate.query(command, reviewRowMapper, productUUID, userUUID);
        return Optional.ofNullable(DataAccessUtils.singleResult(products));
    }

    public Review save(Review r) {
        if (r.getId() != null) {
            String updateSql = """
                    UPDATE product_reviews 
                    SET rating = ?, comment = ?, status = ?, uploaded_at = ? 
                    WHERE id = ?
                    """;
            jdbcTemplate.update(updateSql,
                    r.getRating(), r.getComment(), r.getReviewStatus().name(),
                    Timestamp.from(r.getUpdatedAt()), r.getId());
        } else {
            String insertSql = """
                    INSERT INTO product_reviews (user_id, product_id, rating, created_at, uploaded_at, comment, status) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """;
            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(insertSql, new String[]{"id"});
                ps.setObject(1, r.getUserUUID(), Types.OTHER);
                ps.setObject(2, r.getProductUUID(), Types.OTHER);
                ps.setInt(3, r.getRating());
                ps.setTimestamp(4, Timestamp.from(r.getCreatedAt()));
                ps.setTimestamp(5, Timestamp.from(r.getUpdatedAt()));
                ps.setString(6, r.getComment());
                ps.setString(7, r.getReviewStatus().name());
                return ps;
            }, keyHolder);
            r.setId(keyHolder.getKey().longValue());
        }
        return r;
    }
}

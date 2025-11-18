package com.scammers.productservice.repositories;

import com.scammers.productservice.components.ReviewRowMapper;
import com.scammers.productservice.models.Review;
import com.scammers.productservice.models.dtos.PendingReviewRow;
import com.scammers.productservice.models.enums.ReviewStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.support.DataAccessUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
@Slf4j
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

        public List<PendingReviewRow> findStalePending(Duration ttl, int limit) {
            log.debug("Finding stale pending reviews older than {} with limit {}", ttl, limit);
            String sql = """
                SELECT id, product_id, user_id, status, uploaded_at
                FROM product_reviews
                WHERE status IN ('PENDING_PUB', 'PENDING_DEL')
                  AND uploaded_at < ?
                ORDER BY uploaded_at ASC
                LIMIT ?
                """;
            return jdbcTemplate.query(sql,
                    ps -> {
                        ps.setTimestamp(1, Timestamp.from(Instant.now().minus(ttl)));
                        ps.setInt(2, limit);
                    },
                    (rs, i) -> new PendingReviewRow(
                            rs.getLong("id"),
                            (UUID) rs.getObject("product_id"),
                            (UUID) rs.getObject("user_id"),
                            ReviewStatus.valueOf(rs.getString("status")),
                            rs.getTimestamp("uploaded_at") != null ? rs.getTimestamp("uploaded_at").toInstant() : null
                    )
            );
        }

        public int finalizeSuccess(UUID productId, UUID userId, boolean isPublish) {
            log.debug("Finalizing {} for product {} user {}", isPublish ? "publish" : "delete", productId, userId);
            String sql = isPublish ?
                    """
                    UPDATE product_reviews
                       SET status = 'PUBLISHED', uploaded_at = NOW()
                     WHERE product_id = ? AND user_id = ? AND status = 'PENDING_PUB'
                    """ :
                    """
                    UPDATE product_reviews
                       SET status = 'DELETED', uploaded_at = NOW()
                     WHERE product_id = ? AND user_id = ? AND status = 'PENDING_DEL'
                    """;
            int rows = jdbcTemplate.update(sql, productId, userId);
            if (rows == 0) {
                log.warn("No pending review found for {} product {} user {}", isPublish ? "publish" : "delete", productId, userId);
            }
            return rows;
        }

        public int finalizeFailed(UUID productId, UUID userId) {
            log.debug("Rejecting pending for product {} user {}", productId, userId);
            String sql = """
                UPDATE product_reviews
                   SET status = 'REJECTED', uploaded_at = NOW()
                 WHERE product_id = ? AND user_id = ? AND status IN ('PENDING_PUB', 'PENDING_DEL')
                """;
            int rows = jdbcTemplate.update(sql, productId, userId);
            if (rows == 0) {
                log.warn("No pending review found for reject: product {} user {}", productId, userId);
            }
            return rows;
        }

        public int rejectIfPending(Long reviewId) {
            String sql = """
                UPDATE product_reviews
                   SET status = 'REJECTED', uploaded_at = NOW()
                 WHERE id = ? AND status IN ('PENDING_PUB', 'PENDING_DEL')
                """;
            int rows = jdbcTemplate.update(sql, reviewId);
            if (rows == 0) {
                log.warn("No pending review found for hard reject ID {}", reviewId);
            }
            return rows;
        }
}

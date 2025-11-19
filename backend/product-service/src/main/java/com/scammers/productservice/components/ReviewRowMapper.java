package com.scammers.productservice.components;

import com.scammers.productservice.models.Review;
import com.scammers.productservice.models.enums.ReviewStatus;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;
@Component
public class ReviewRowMapper implements RowMapper<Review> {
    @Override
    public Review mapRow(ResultSet rs, int rowNum) throws SQLException {
        UUID product_uuid = UUID.fromString((rs.getString("product_id").toUpperCase()));
        UUID user_uuid = UUID.fromString((rs.getString("user_id").toUpperCase()));
        ReviewStatus status = ReviewStatus.valueOf(rs.getString("status").toUpperCase());

        return new Review(
                rs.getLong("id"),
                user_uuid,
                product_uuid,
                rs.getShort("rating"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("uploaded_at").toInstant(),
                rs.getString("comment"),
                status
        );
    }
}

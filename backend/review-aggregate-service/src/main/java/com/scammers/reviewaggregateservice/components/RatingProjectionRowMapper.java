package com.scammers.reviewaggregateservice.components;

import com.scammers.reviewaggregateservice.models.RatingProjection;
import com.scammers.reviewaggregateservice.repositories.RatingProjectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class RatingProjectionRowMapper implements RowMapper<RatingProjection> {
    @Override
    public RatingProjection mapRow(ResultSet rs, int rowNum) throws SQLException {
        RatingProjection rp = new RatingProjection();

        rp.setProductUuid((UUID) rs.getObject("product_uuid"));

        rp.setCnt(rs.getLong("cnt"));
        rp.setSum(rs.getLong("sum"));
        rp.setAvg(rs.getBigDecimal("avg"));

        rp.setB1(rs.getLong("b1"));
        rp.setB2(rs.getLong("b2"));
        rp.setB3(rs.getLong("b3"));
        rp.setB4(rs.getLong("b4"));
        rp.setB5(rs.getLong("b5"));

        rp.setLastReviewAt(rs.getTimestamp("last_review_at").toInstant());

        return rp;
    }
}
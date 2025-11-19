package com.scammers.reviewaggregateservice.repositories;

import com.scammers.reviewaggregateservice.components.RatingProjectionRowMapper;
import com.scammers.reviewaggregateservice.models.RatingProjection;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class RatingProjectionRepository {
    private final JdbcTemplate jdbc;
    private final RatingProjectionRowMapper mapper;

    public void applyCreate(UUID productId, int rating) {
        int b1=0,b2=0,b3=0,b4=0,b5=0;
        switch (rating) {
            case 1 -> b1 = 1;
            case 2 -> b2 = 1;
            case 3 -> b3 = 1;
            case 4 -> b4 = 1;
            case 5 -> b5 = 1;
        }

        String sql = """
            insert into rating_projection(product_uuid, cnt, sum, avg, b1,b2,b3,b4,b5, last_review_at)
            values(?, 1, ?, 0, ?,?,?,?,?, now())
            on conflict (product_uuid) do update set
                cnt = rating_projection.cnt + 1,
                sum = rating_projection.sum + excluded.sum,
                b1 = rating_projection.b1 + excluded.b1,
                b2 = rating_projection.b2 + excluded.b2,
                b3 = rating_projection.b3 + excluded.b3,
                b4 = rating_projection.b4 + excluded.b4,
                b5 = rating_projection.b5 + excluded.b5,
                avg = round((rating_projection.sum + excluded.sum)::numeric / (rating_projection.cnt + 1), 2),
                last_review_at = now()
            """;

        jdbc.update(sql, productId, rating, b1, b2, b3, b4, b5);
    }

    public void applyDelete(UUID productId, int rating) {
        int b1=0,b2=0,b3=0,b4=0,b5=0;
        switch (rating) {
            case 1 -> b1 = -1;
            case 2 -> b2 = -1;
            case 3 -> b3 = -1;
            case 4 -> b4 = -1;
            case 5 -> b5 = -1;
        }

        String sql = """
            update rating_projection set
                cnt = greatest(cnt - 1, 0),
                sum = sum - ?,
                b1 = b1 + ?, b2 = b2 + ?, b3 = b3 + ?, b4 = b4 + ?, b5 = b5 + ?,
                avg = case when greatest(cnt - 1, 0) > 0
                           then round((sum - ?)::numeric / greatest(cnt - 1, 0), 2)
                           else 0 end,
                last_review_at = now()
            where product_uuid = ?
            """;

        jdbc.update(sql, rating, b1, b2, b3, b4, b5, rating, productId);
    }

    public void applyUpdate(UUID productId, int oldRating, int newRating) {
        if (oldRating == newRating) return;

        int sumDelta = newRating - oldRating;
        int b1=0,b2=0,b3=0,b4=0,b5=0;

        switch (oldRating) {
            case 1 -> b1--;
            case 2 -> b2--;
            case 3 -> b3--;
            case 4 -> b4--;
            case 5 -> b5--;
        }

        switch (newRating) {
            case 1 -> b1++;
            case 2 -> b2++;
            case 3 -> b3++;
            case 4 -> b4++;
            case 5 -> b5++;
        }

        String sql = """
            update rating_projection set
                sum = sum + ?,
                b1 = b1 + ?, b2 = b2 + ?, b3 = b3 + ?, b4 = b4 + ?, b5 = b5 + ?,
                avg = case when cnt > 0 
                           then round((sum + ?)::numeric / cnt, 2) 
                           else 0 end,
                last_review_at = now()
            where product_uuid = ?
            """;

        jdbc.update(sql, sumDelta, b1, b2, b3, b4, b5, sumDelta, productId);
    }

    public Optional<RatingProjection> findByProductUuid(UUID productUuid) {
        String sql = """
            SELECT product_uuid, cnt, sum, avg,
                   b1, b2, b3, b4, b5, last_review_at
            FROM rating_projection
            WHERE product_uuid = ?
            """;
        List<RatingProjection> results = jdbc.query(sql, mapper, productUuid);
        return results.stream().findFirst();
    }
}


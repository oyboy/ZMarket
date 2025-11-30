package com.scammers.reviewaggregateservice.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RatingProjection {
    private UUID productUuid;
    private Long cnt;
    private Long sum;
    private BigDecimal avg;

    private Long b1;
    private Long b2;
    private Long b3;
    private Long b4;
    private Long b5;

    private Instant lastReviewAt;
}
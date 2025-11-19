package com.scammers.reviewaggregateservice.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
public class RatingResponse {
    private Long cnt;
    private Long sum;
    private BigDecimal avg;

    private Long b1;
    private Long b2;
    private Long b3;
    private Long b4;
    private Long b5;

    public RatingResponse(RatingProjection projection) {
        this.cnt = projection.getCnt();
        this.sum = projection.getSum();
        this.avg = projection.getAvg();
        this.b1 = projection.getB1();
        this.b2 = projection.getB2();
        this.b3 = projection.getB3();
        this.b4 = projection.getB4();
        this.b5 = projection.getB5();
    }
}
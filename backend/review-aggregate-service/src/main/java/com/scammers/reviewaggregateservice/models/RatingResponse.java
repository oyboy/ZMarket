package com.scammers.reviewaggregateservice.models;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
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

    public static RatingResponse empty() {
        RatingResponse r = new RatingResponse();
        r.setCnt(0L);
        r.setSum(0L);
        r.setAvg(BigDecimal.ZERO);
        r.setB1(0L);
        r.setB2(0L);
        r.setB3(0L);
        r.setB4(0L);
        r.setB5(0L);
        return r;
    }
}
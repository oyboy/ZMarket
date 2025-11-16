package com.scammers.productservice.models.responses;

public record RatingResponse(
        long cnt,
        double avg,
        long b1, long b2, long b3, long b4, long b5
) {}
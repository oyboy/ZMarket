package com.scammers.reviewaggregateservice;

import com.scammers.reviewaggregateservice.models.RatingResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ratings")
@RequiredArgsConstructor
public class RatingController {
    private final RatingsAggregator ratingsAggregator;

    @GetMapping("/{productId}")
    public ResponseEntity<RatingResponse> getRating(@PathVariable UUID productId) {
        return ratingsAggregator.getRatingProjection(productId)
                .map(projection -> ResponseEntity.ok(new RatingResponse(projection)))
                .orElse(ResponseEntity.notFound().build());
    }
}
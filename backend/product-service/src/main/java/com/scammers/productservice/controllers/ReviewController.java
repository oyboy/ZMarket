package com.scammers.productservice.controllers;

import com.scammers.productservice.models.requests.ReviewCreateRequest;
import com.scammers.productservice.models.responses.RatingResponse;
import com.scammers.productservice.services.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products/{product_uuid}/reviews")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService service;
    private final RatingClient ratingClient;

    @PostMapping
    public ResponseEntity<Void> makeReview(@PathVariable("product_uuid") UUID productUUID,
                                     @AuthenticationPrincipal Jwt jwt,
                                     @RequestBody ReviewCreateRequest reviewCreateRequest
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        service.saveReviewOnProduct(productUUID, userId, reviewCreateRequest);
        return ResponseEntity.accepted().build();
    }

    @DeleteMapping("/{review_id}")
    public ResponseEntity<Void> deleteReview(@PathVariable("product_uuid") UUID productUUID,
                                             @AuthenticationPrincipal Jwt jwt,
                                             @PathVariable("review_id") UUID reviewUUID
    ) {
        UUID  userId = UUID.fromString(jwt.getSubject());
        service.deleteReviewOnProduct(reviewUUID, productUUID, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/rating")
    public ResponseEntity<RatingResponse> getRating(@PathVariable("product_uuid") UUID productUUID) {
        RatingResponse rating = ratingClient.getRating(productUUID);
        return ResponseEntity.ok(rating);
    }
}
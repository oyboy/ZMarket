package com.scammers.productservice.controllers;

import com.scammers.productservice.models.dtos.ShowReview;
import com.scammers.productservice.models.requests.ReviewCreateRequest;
import com.scammers.productservice.models.responses.RatingResponse;
import com.scammers.productservice.services.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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

    @DeleteMapping
    public ResponseEntity<Void> deleteReview(@PathVariable("product_uuid") UUID productUUID,
                                             @AuthenticationPrincipal Jwt jwt
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        service.initiateDeleteReview(productUUID, userId, false);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{user_id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteSomeoneReview(@PathVariable("product_uuid") UUID productUUID,
                                                    @PathVariable("user_id") UUID targetUserUUID) {
        service.initiateDeleteReview(productUUID, targetUserUUID, true);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/rating")
    public ResponseEntity<RatingResponse> getRating(@PathVariable("product_uuid") UUID productUUID) {
        RatingResponse rating = ratingClient.getRating(productUUID);
        return ResponseEntity.ok(rating);
    }

    @GetMapping
    public ResponseEntity<List<ShowReview>> getReviews(@PathVariable("product_uuid") UUID productUUID,
                                                       @RequestParam(defaultValue = "10") int limit,
                                                       @RequestParam(defaultValue = "0") int offset) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        int safeOffset = Math.max(0, offset);
        return ResponseEntity.ok(service.getReviewsForProduct(productUUID, safeLimit, safeOffset));
    }
}
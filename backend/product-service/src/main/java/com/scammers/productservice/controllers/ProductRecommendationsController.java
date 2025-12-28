package com.scammers.productservice.controllers;

import com.scammers.productservice.models.Product;
import com.scammers.productservice.services.ProductRecommendationsFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products/recommendations")
@RequiredArgsConstructor
public class ProductRecommendationsController {
    private final ProductRecommendationsFacade recommendationsFacade;

    @GetMapping("/popular")
    public ResponseEntity<List<Product>> getPopular(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(
                recommendationsFacade.getPopularProducts(limit)
        );
    }

    @GetMapping("/personal")
    public ResponseEntity<List<Product>> getPersonal(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "10") int limit) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(
                recommendationsFacade.getPersonalRecommendations(userId, limit)
        );
    }

    @GetMapping("/{product_uuid}/same-manufacturer")
    public ResponseEntity<List<Product>> getSameManufacturer(
            @PathVariable("product_uuid") UUID productId,
            @RequestParam(defaultValue = "6") int limit) {

        int safeLimit = Math.max(1, Math.min(limit, 50));
        return ResponseEntity.ok(
                recommendationsFacade.getProductsFromSameManufacturer(productId, safeLimit)
        );
    }
}

package com.scammers.recservice.controllers;

import com.scammers.recservice.models.responses.ApiResponse;
import com.scammers.recservice.services.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/recommendations")
@RequiredArgsConstructor
public class RecommendationController {
    private final RecommendationService recommendationService;

    @GetMapping("/popular")
    public ApiResponse<List<UUID>> getPopular(
            @RequestParam(defaultValue = "5") int limit) {

        int safeLimit = Math.max(1, Math.min(limit, 100));
        return ApiResponse.ok(
                recommendationService.getGlobalPopular(safeLimit)
        );
    }

    @GetMapping("/user")
    public ApiResponse<List<UUID>> getForCurrentUser(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "10") int limit) {

        UUID userId = UUID.fromString(jwt.getSubject());
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return ApiResponse.ok(
                recommendationService.recommendForUser(userId, safeLimit)
        );
    }

    @GetMapping("/users/{user_id}")
    public ApiResponse<List<UUID>> getForUser(
            @PathVariable("user_id") UUID userId,
            @RequestParam(defaultValue = "10") int limit) {

        int safeLimit = Math.max(1, Math.min(limit, 100));
        return ApiResponse.ok(
                recommendationService.recommendForUser(userId, safeLimit)
        );
    }
}
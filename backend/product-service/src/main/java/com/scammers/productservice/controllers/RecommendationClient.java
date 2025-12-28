package com.scammers.productservice.controllers;

import com.scammers.productservice.models.responses.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.UUID;

@FeignClient(
        name = "recommendation-service",
        url = "${services.recommendation-service.url}"
)
public interface RecommendationClient {
    @GetMapping("/api/v1/recommendations/popular")
    ApiResponse<List<UUID>> getPopular(@RequestParam("limit") int limit);

    @GetMapping("/api/v1/recommendations/users/{user_id}")
    ApiResponse<List<UUID>> getForUser(
            @PathVariable("user_id") UUID userId,
            @RequestParam("limit") int limit
    );
}
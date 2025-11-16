package com.scammers.productservice.controllers;

import com.scammers.productservice.models.responses.RatingResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(
        name = "ratings-aggregator",
        url = "${services.ratings-aggregator.url}"
)
public interface RatingClient {
    @GetMapping("/api/v1/ratings/{productId}")
    RatingResponse getRating(@PathVariable("productId") UUID productId);
}


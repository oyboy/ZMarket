package com.scammers.cartservice.controllers;

import com.scammers.cartservice.configs.FeignSecurityConfig;
import com.scammers.cartservice.models.responses.ProductResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(
        name = "product-service",
        url = "${services.product-service.url}",
        configuration = FeignSecurityConfig.class
)
public interface ProductClient {
    @GetMapping("/api/v1/products/{productId}")
    ProductResponse getProduct(@PathVariable("productId") UUID productId);

    @GetMapping("/api/v1/products/{productId}/main-image-id")
    String getMainImageId(@PathVariable("productId") UUID productId);
}
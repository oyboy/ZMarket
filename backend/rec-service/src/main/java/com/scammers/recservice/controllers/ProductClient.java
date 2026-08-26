package com.scammers.recservice.controllers;

import com.scammers.recservice.models.responses.ProductInfo;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(
        name = "product-service",
        url = "${services.product-service.url}"
)
public interface ProductClient {
    @GetMapping("/api/v1/products/{productId}")
    ProductInfo getProductInfo(@PathVariable("productId") UUID productId);
}

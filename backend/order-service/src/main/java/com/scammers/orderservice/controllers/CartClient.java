package com.scammers.orderservice.controllers;

import com.scammers.orderservice.models.dtos.CartDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(
        name = "cart-service",
        url = "${services.cart-service.url}"
)
public interface CartClient {
    @GetMapping("/api/v1/cart")
    CartDto getCart();

    @DeleteMapping("/api/v1/cart")
    void clearCart();
}
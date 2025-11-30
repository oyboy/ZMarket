package com.scammers.cartservice.controllers;

import com.scammers.cartservice.configs.SecurityUtils;
import com.scammers.cartservice.models.dtos.CartDto;
import com.scammers.cartservice.models.requests.AddCartItemRequest;
import com.scammers.cartservice.models.requests.UpdateCartItemRequest;
import com.scammers.cartservice.services.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
@Validated
public class CartController {
    private final CartService cartService;

    private UUID currentUserId() {
        return SecurityUtils.getCurrentUserUUID();
    }

    @GetMapping
    public CartDto getCart() {
        UUID userId = currentUserId();
        return cartService.getCart(userId);
    }

    @PostMapping("/items")
    public CartDto addToCart(@RequestBody @Valid AddCartItemRequest request) {
        UUID userId = currentUserId();
        return cartService.addToCart(userId, request.productId(), request.quantity());
    }

    @PutMapping("/items")
    public CartDto setQuantity(@RequestBody @Valid UpdateCartItemRequest req) {
        UUID userId = currentUserId();
        return cartService.setQuantity(userId, req.productId(), req.quantity());
    }

    @DeleteMapping("/items/{productId}")
    public CartDto removeFromCart(@PathVariable UUID productId) {
        UUID userId = currentUserId();
        return cartService.removeFromCart(userId, productId);
    }

    @DeleteMapping
    public ResponseEntity<Void> clearCart() {
        UUID userId = currentUserId();
        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }
}
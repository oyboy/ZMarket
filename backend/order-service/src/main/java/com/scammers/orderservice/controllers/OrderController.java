package com.scammers.orderservice.controllers;

import com.scammers.orderservice.configs.SecurityUtils;
import com.scammers.orderservice.models.SellerOrderView;
import com.scammers.orderservice.models.dtos.OrderDto;
import com.scammers.orderservice.models.requests.CreateOrderRequest;
import com.scammers.orderservice.models.responses.ApiResponse;
import com.scammers.orderservice.services.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;

    private UUID currentUserId() {
        return SecurityUtils.getCurrentUserUUID();
    }

    @PostMapping
    public ApiResponse<OrderDto> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        OrderDto order = orderService.createOrder(currentUserId(), request.deliveryAddress());
        return ApiResponse.ok(order, "Заказ успешно создан");
    }

    @GetMapping("/{orderId}")
    public ApiResponse<OrderDto> getOrder(@PathVariable UUID orderId) {
        OrderDto order = orderService.getOrderById(orderId);
        return ApiResponse.ok(order);
    }

    @GetMapping("/my")
    public ApiResponse<List<OrderDto>> getMyOrders() {
        List<OrderDto> orders = orderService.getUserOrders(currentUserId());
        return ApiResponse.ok(orders);
    }

    @GetMapping("/seller")
    @PreAuthorize("hasAuthority('SELLER')")
    public ApiResponse<List<SellerOrderView>> getSellerOrders() {
        return ApiResponse.ok(orderService.getOrdersForSeller(currentUserId()));
    }
}

package com.scammers.orderservice;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class OrderService {
    @Autowired
    private ProductClient productClient;

    public OrderResponse createOrder(String productId) {
        ProductClient.ProductResponse product = productClient.getProduct(productId);

        return new OrderResponse(UUID.randomUUID().toString(),
                product.name(),
                product.price(),
                "CREATED");
    }

    record OrderResponse(String orderId, String productName, double price, String status) {}
}
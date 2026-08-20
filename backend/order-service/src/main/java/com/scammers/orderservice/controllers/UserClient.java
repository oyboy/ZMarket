package com.scammers.orderservice.controllers;

import com.scammers.orderservice.models.CustomerDetails;
import com.scammers.orderservice.models.responses.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(
        name = "user-service",
        url = "${services.user-service.url}"
)
public interface UserClient {
    @GetMapping("/api/v1/users/{userId}/contact-info")
    ApiResponse<CustomerDetails> getUserContactInfo(@PathVariable UUID userId);

    @GetMapping("/api/v1/users/demo/slow-contact-info/{userId}")
    ApiResponse<CustomerDetails> getSlowUserContactInfo(@PathVariable UUID userId);
}
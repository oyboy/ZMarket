package com.scammers.cartservice.controllers;

import com.scammers.cartservice.configs.FeignSecurityConfig;
import com.scammers.cartservice.models.responses.ApiResponse;
import com.scammers.cartservice.models.responses.SellerInfoResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(
        name = "user-service",
        url = "${services.user-service.url}",
        configuration = FeignSecurityConfig.class
)
public interface UserClient {
    @GetMapping("/api/v1/users/{user-id}/seller-info")
    ApiResponse<SellerInfoResponse> getSellerInfo(@PathVariable("user-id") UUID sellerId);
}

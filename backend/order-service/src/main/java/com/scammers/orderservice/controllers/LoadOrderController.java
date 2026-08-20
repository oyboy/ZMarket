package com.scammers.orderservice.controllers;

import com.scammers.orderservice.models.CustomerDetails;
import com.scammers.orderservice.models.responses.ApiResponse;
import com.scammers.orderservice.services.OrderUserInfoDemoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class LoadOrderController {
    private final OrderUserInfoDemoService demoUserInfoService;

    @GetMapping("/demo/user-contact")
    public ApiResponse<CustomerDetails> demoUserContact(@RequestParam UUID userId) {
        CustomerDetails details = demoUserInfoService.fetchUserContact(userId);
        return ApiResponse.ok(details);
    }
}

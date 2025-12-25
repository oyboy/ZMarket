package com.scammers.orderservice.services;

import com.scammers.commonresilience.Resilient;
import com.scammers.orderservice.controllers.UserClient;
import com.scammers.orderservice.models.CustomerDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Resilient("order-userinfo-demo")
public class OrderUserInfoDemoService {

    private final UserClient userClient;

    public CustomerDetails fetchUserContact(UUID userId) {
        return userClient.getSlowUserContactInfo(userId).data();
    }
}
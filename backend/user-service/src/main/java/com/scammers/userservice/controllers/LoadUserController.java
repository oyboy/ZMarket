package com.scammers.userservice.controllers;

import com.scammers.userservice.models.BuyerProfile;
import com.scammers.userservice.models.dtos.BuyerContactInfoDto;
import com.scammers.userservice.models.responses.ApiResponse;
import com.scammers.userservice.services.KeycloakUserService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class LoadUserController {
    private final KeycloakUserService userService;

    @GetMapping("/demo/slow-contact-info/{userId}")
    public ApiResponse<BuyerContactInfoDto> slowContactInfo(@PathVariable UUID userId) {
        try {
            Thread.sleep(2000);
        } catch (InterruptedException ignored) {}

        BuyerProfile profile = userService.getBuyerProfile(userId)
                .orElseThrow(() -> new EntityNotFoundException("Профиль покупателя не найден"));
        return ApiResponse.ok(BuyerContactInfoDto.from(profile));
    }
}

package com.scammers.userservice.controllers;

import com.scammers.userservice.services.KeycloakUserService;
import com.scammers.userservice.models.requests.CompanyRegistrationRequest;
import com.scammers.userservice.models.requests.UserRegistrationRequest;
import com.scammers.userservice.models.responses.ApiResponse;
import com.scammers.userservice.models.responses.UserRegistrationResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Validated
public class UserController {
    private final KeycloakUserService userService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserRegistrationResponse>> register(@Valid @RequestBody UserRegistrationRequest req) {
        var id = userService.registerUser(req);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok(new UserRegistrationResponse(id)));
    }

    @PostMapping("/become-seller")
    @PreAuthorize("hasAuthority('USER')")
    public ResponseEntity<ApiResponse<Void>> becomeSeller(@AuthenticationPrincipal Jwt jwt,
                                          @Valid @RequestBody CompanyRegistrationRequest req) {

        UUID userId = extractUserId(jwt);

        userService.upgradeToSeller(userId, req);
        return ResponseEntity.ok(ApiResponse.success("Вы успешно стали продавцом"));
    }

    private UUID extractUserId(Jwt jwt) {
        String sub = jwt.getClaimAsString("sub");
        if (sub == null || sub.isBlank()) {
            throw new IllegalArgumentException("Некорректный токен: отсутствует идентификатор пользователя");
        }
        return UUID.fromString(sub);
    }
}
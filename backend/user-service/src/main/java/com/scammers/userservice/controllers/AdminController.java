package com.scammers.userservice.controllers;

import com.scammers.userservice.services.AdminService;
import com.scammers.userservice.models.dtos.SellerVerificationDto;
import com.scammers.userservice.models.responses.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {
    private final AdminService adminService;

    @GetMapping("/pending-sellers")
    public ResponseEntity<ApiResponse<List<SellerVerificationDto>>> getPendingSellers() {
        var pendingProfiles = adminService.getPendingSellerVerifications()
                .stream()
                .map(p -> new SellerVerificationDto(
                        p.getUser().getId(),
                        p.getUser().getEmail(),
                        p.getCompanyName(),
                        p.getInn(),
                        p.getDescription(),
                        p.getCreatedAt()
                ))
                .toList();

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.ok(pendingProfiles));
    }

    @GetMapping("/rejected-sellers")
    public ResponseEntity<ApiResponse<List<SellerVerificationDto>>> getRejectedSellers() {
        var list = adminService.getRejectedSellerVerifications()
                .stream()
                .map(p -> new SellerVerificationDto(
                        p.getUser().getId(),
                        p.getUser().getEmail(),
                        p.getCompanyName(),
                        p.getInn(),
                        p.getDescription(),
                        p.getCreatedAt()
                ))
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PostMapping("/verify-seller/{userId}")
    public ResponseEntity<ApiResponse<Void>> verifySeller(@AuthenticationPrincipal Jwt jwt,
                                                    @PathVariable UUID userId) {
        UUID currentId = extractUserId(jwt);
        adminService.acceptSellerVerification(userId, currentId);

        return ResponseEntity.ok(ApiResponse.success("Верификация успешна"));
    }

    @PostMapping("/reject-seller-verification/{userId}")
    public ResponseEntity<ApiResponse<Void>> rejectSellerVerification(@PathVariable UUID userId,
                                                                      @RequestBody(required = false) String reason) {
        adminService.rejectSellerVerification(userId, reason);

        return ResponseEntity.ok(ApiResponse.success("Верификация отклонена"));
    }

    private UUID extractUserId(Jwt jwt) {
        String sub = jwt.getClaimAsString("sub");
        if (sub == null || sub.isBlank()) {
            throw new IllegalArgumentException("Некорректный токен: отсутствует идентификатор пользователя");
        }
        return UUID.fromString(sub);
    }
}
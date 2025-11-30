package com.scammers.userservice.models.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SellerVerificationDto {
    private UUID userId;
    private String email;
    private String companyName;
    private String inn;
    private String description;
    private LocalDateTime createdAt;
}
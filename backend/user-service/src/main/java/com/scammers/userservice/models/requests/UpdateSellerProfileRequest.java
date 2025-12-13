package com.scammers.userservice.models.requests;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateSellerProfileRequest {
    @NotBlank
    private String companyName;

    private String description;
}

package com.scammers.userservice.models.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CompanyRegistrationRequest(
        @NotBlank
        String name,

        @NotBlank
        @Pattern(regexp = "\\d{10}|\\d{12}", message = "ИНН должен содержать 10 или 12 цифр")
        String inn,

        String description
) {}
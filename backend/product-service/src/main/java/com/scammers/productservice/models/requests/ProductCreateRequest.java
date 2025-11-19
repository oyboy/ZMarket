package com.scammers.productservice.models.requests;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record ProductCreateRequest(
        @NotBlank String title,
        @NotBlank String description,
        @DecimalMin(value = "0.01") Double price,
        @Min(0) Long stock
) { }
package com.scammers.productservice.models.requests;

import jakarta.validation.constraints.NotBlank;

public record CategoryRequest(
        @NotBlank(message = "Название обязательно")
        String name,
        Long parentId,
        String slug
) {}
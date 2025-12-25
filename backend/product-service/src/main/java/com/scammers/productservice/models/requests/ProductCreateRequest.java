package com.scammers.productservice.models.requests;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record ProductCreateRequest(
        @NotBlank(message = "Название не может быть пустым")
        String title,

        @NotBlank(message = "Описание не может быть пустым")
        String description,

        @DecimalMin(value = "0.01", message = "Цена должна быть больше 0")
        Double price,

        @Min(value = 0, message = "Остаток не может быть отрицательным")
        Long stock,

        @NotNull(message = "Укажите категорию товара")
        Long categoryId,

        Map<String, Object> attributes
) { }
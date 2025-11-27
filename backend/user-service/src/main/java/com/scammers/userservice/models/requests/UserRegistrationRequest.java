package com.scammers.userservice.models.requests;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserRegistrationRequest(
        @NotBlank
        String firstName,

        @NotBlank
        String lastName,

        @NotBlank
        @Email(message = "Некорректный формат email")
        String email,

        @NotBlank
        @Size(min = 8, max = 72, message = "Пароль должен быть от 8 до 72 символов")
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
                message = "Пароль должен содержать строчные, заглавные буквы и цифры"
        )
        String password,

        @NotBlank
        String confirmPassword
) {
    public UserRegistrationRequest {
        if (!password.equals(confirmPassword)) {
            throw new IllegalArgumentException("Пароли не совпадают");
        }
    }
}

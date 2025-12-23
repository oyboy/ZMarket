package com.scammers.commonresilience.exceptions;

import com.fasterxml.jackson.databind.ObjectMapper;
import feign.Response;
import feign.codec.ErrorDecoder;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.InputStream;

@Slf4j
@Component
@RequiredArgsConstructor
public class CustomErrorDecoder implements ErrorDecoder {
    private final ObjectMapper objectMapper;

    @Override
    public Exception decode(String methodKey, Response response) {
        String errorMessage = null;
        String url = response.request().url();

        String clientName = "unknown";
        try {
            if (response.request().requestTemplate() != null &&
                    response.request().requestTemplate().feignTarget() != null) {
                clientName = response.request().requestTemplate().feignTarget().name();
            }
        } catch (Exception ignored) {
        }

        if (response.body() != null) {
            try (InputStream body = response.body().asInputStream()) {
                ErrorResponse error = objectMapper.readValue(body, ErrorResponse.class);
                errorMessage = error.message();
            } catch (Exception e) {
                log.warn("Failed to parse error body from {}: {}", methodKey, e.getMessage());
            }
        }

        if (errorMessage == null) {
            errorMessage = "Ошибка внешнего сервиса [" + response.status() + "]";
        }

        return switch (response.status()) {
            case 400 -> new BadRequestException(errorMessage);
            case 404 -> new NotFoundException(errorMessage);
            case 500, 502, 503 -> new ExternalServiceException(clientName, url, response.status(), "Внешний сервис недоступен: " + errorMessage);
            default -> new RuntimeException("Неизвестная ошибка (" + response.status() + "): " + errorMessage);
        };
    }
}

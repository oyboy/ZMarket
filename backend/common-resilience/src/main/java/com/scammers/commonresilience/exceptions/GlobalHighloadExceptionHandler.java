package com.scammers.commonresilience.exceptions;

import io.github.resilience4j.ratelimiter.RequestNotPermitted;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
@RequiredArgsConstructor
@Slf4j
@Order(Ordered.HIGHEST_PRECEDENCE)
public class GlobalHighloadExceptionHandler {
    @ExceptionHandler(RequestNotPermitted.class)
    @ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
    public ErrorResponse handleRequestNotPermitted(RequestNotPermitted ex) {
        log.warn("Too many requests {}", ex.getMessage());
        return new ErrorResponse(
                HttpStatus.TOO_MANY_REQUESTS.value(),
                "Высокая нагрузка на сервис, повторите позже",
                null
        );
    }

    @ExceptionHandler(io.github.resilience4j.bulkhead.BulkheadFullException.class)
    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    public ErrorResponse handleBulkheadFull(io.github.resilience4j.bulkhead.BulkheadFullException ex) {
        log.warn("Service unavailable, bulkhead full {}", ex.getMessage());
        return new ErrorResponse(
                HttpStatus.SERVICE_UNAVAILABLE.value(),
                "Сервис перегружен, попробуйте позже",
                null);
    }

    @ExceptionHandler(io.github.resilience4j.circuitbreaker.CallNotPermittedException.class)
    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    public ErrorResponse handleCircuitBreaker(io.github.resilience4j.circuitbreaker.CallNotPermittedException ex) {
        log.warn("Circuit breaker in OPEN state {}", ex.getMessage());
        return new ErrorResponse(
                HttpStatus.SERVICE_UNAVAILABLE.value(),
                "Сервис временно недоступен, попробуйте позже",
                null);
    }

    @ExceptionHandler(ExternalServiceException.class)
    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    public ErrorResponse handleExternalService(ExternalServiceException ex) {
        log.warn("External service error: client={}, status={}, url={}",
                ex.getClientName(), ex.getStatusCode(), ex.getUrl());

        return new ErrorResponse(
                HttpStatus.SERVICE_UNAVAILABLE.value(),
                "Сервис не отвечает. Пожалуйста, попробуйте позже.",
                null
        );
    }
}
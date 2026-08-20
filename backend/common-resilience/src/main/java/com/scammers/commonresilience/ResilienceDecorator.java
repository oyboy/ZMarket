package com.scammers.commonresilience;

import io.github.resilience4j.bulkhead.Bulkhead;
import io.github.resilience4j.bulkhead.BulkheadRegistry;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.decorators.Decorators;
import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryRegistry;
import io.github.resilience4j.timelimiter.TimeLimiter;
import io.github.resilience4j.timelimiter.TimeLimiterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.function.Supplier;

@Component
@RequiredArgsConstructor
@Slf4j
public class ResilienceDecorator {
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    private final CircuitBreakerRegistry cbRegistry;
    private final RetryRegistry retryRegistry;
    private final BulkheadRegistry bhRegistry;
    private final TimeLimiterRegistry tlRegistry;
    private final RateLimiterRegistry rlRegistry;

    public <T> Supplier<T> decorate(String instanceName, Supplier<T> supplier) {
        CircuitBreaker cb = cbRegistry.circuitBreaker(instanceName);
        Retry retry = retryRegistry.retry(instanceName);
        Bulkhead bh = bhRegistry.bulkhead(instanceName);
        TimeLimiter tl = tlRegistry.timeLimiter(instanceName);
        RateLimiter rl = rlRegistry.rateLimiter(instanceName);

        java.util.function.Supplier<java.util.concurrent.Future<T>> futureSupplier =
                () -> scheduler.submit(supplier::get);

        TimeLimiter.decorateFutureSupplier(tl, futureSupplier);

        return Decorators.ofSupplier(supplier)
                .withCircuitBreaker(cb)
                .withRetry(retry)
                .withBulkhead(bh)
                .withRateLimiter(rl)
                .decorate();
    }
}

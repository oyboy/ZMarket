package com.scammers.commonresilience;

import io.github.resilience4j.bulkhead.BulkheadConfig;
import io.github.resilience4j.bulkhead.BulkheadRegistry;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.core.IntervalFunction;
import io.github.resilience4j.micrometer.tagged.*;
import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import io.github.resilience4j.retry.RetryConfig;
import io.github.resilience4j.retry.RetryRegistry;
import io.github.resilience4j.timelimiter.TimeLimiterConfig;
import io.github.resilience4j.timelimiter.TimeLimiterRegistry;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

@Configuration
@EnableConfigurationProperties(ResilienceProperties.class)
@RequiredArgsConstructor
@EnableAspectJAutoProxy
public class ResilienceConfig {
    private final ResilienceProperties props;

    @Bean
    public ResilienceAspect resilienceAspect(ResilienceDecorator decorator) {
        return new ResilienceAspect(decorator);
    }

    @Bean
    public CircuitBreakerRegistry circuitBreakerRegistry(MeterRegistry meterRegistry) {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
                .failureRateThreshold(props.getCircuitBreaker().getFailureRateThreshold())
                .slowCallRateThreshold(props.getCircuitBreaker().getSlowCallRateThreshold())
                .slowCallDurationThreshold(props.getCircuitBreaker().getSlowCallDurationThreshold())
                .waitDurationInOpenState(props.getCircuitBreaker().getWaitDurationInOpenState())
                .permittedNumberOfCallsInHalfOpenState(props.getCircuitBreaker().getPermittedNumberOfCallsInHalfOpenState())
                .slidingWindowSize(props.getCircuitBreaker().getSlidingWindowSize())
                .minimumNumberOfCalls(props.getCircuitBreaker().getMinimumNumberOfCalls())
                .build();

        CircuitBreakerRegistry registry = CircuitBreakerRegistry.of(config);

        TaggedCircuitBreakerMetrics.ofCircuitBreakerRegistry(registry)
                .bindTo(meterRegistry);

        return registry;
    }

    @Bean
    public RetryRegistry retryRegistry() {
        ResilienceProperties.Retry r = props.getRetry();

        RetryConfig config;

        if (r.isEnableExponentialBackoff()) {
            config = RetryConfig.custom()
                    .maxAttempts(r.getMaxAttempts())
                    .intervalFunction(
                            IntervalFunction.ofExponentialBackoff(
                                    r.getWaitDuration(),
                                    r.getBackoffMultiplier()
                            )
                    )
                    .build();
        } else {
            config = RetryConfig.custom()
                    .maxAttempts(r.getMaxAttempts())
                    .waitDuration(r.getWaitDuration())
                    .build();
        }

        return RetryRegistry.of(config);
    }

    @Bean
    public BulkheadRegistry bulkheadRegistry(MeterRegistry meterRegistry) {
        BulkheadConfig config = BulkheadConfig.custom()
                .maxConcurrentCalls(props.getBulkhead().getMaxConcurrentCalls())
                .maxWaitDuration(props.getBulkhead().getMaxWaitDuration())
                .build();

        BulkheadRegistry registry = BulkheadRegistry.of(config);

        TaggedBulkheadMetrics.ofBulkheadRegistry(registry)
                .bindTo(meterRegistry);

        return registry;
    }

    @Bean
    public TimeLimiterRegistry timeLimiterRegistry(MeterRegistry meterRegistry) {
        TimeLimiterConfig config = TimeLimiterConfig.custom()
                .timeoutDuration(props.getTimeLimiter().getTimeoutDuration())
                .build();

        TimeLimiterRegistry registry = TimeLimiterRegistry.of(config);

        TaggedTimeLimiterMetrics.ofTimeLimiterRegistry(registry)
                .bindTo(meterRegistry);

        return registry;
    }

    @Bean
    public RateLimiterRegistry rateLimiterRegistry(MeterRegistry meterRegistry) {
        RateLimiterConfig config = RateLimiterConfig.custom()
                .limitForPeriod(props.getRateLimiter().getLimitForPeriod())
                .limitRefreshPeriod(props.getRateLimiter().getLimitRefreshPeriod())
                .timeoutDuration(props.getRateLimiter().getTimeoutDuration())
                .build();

        RateLimiterRegistry registry = RateLimiterRegistry.of(config);

        TaggedRateLimiterMetrics.ofRateLimiterRegistry(registry)
                .bindTo(meterRegistry);

        return registry;
    }
}
package com.scammers.commonresilience;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import java.time.Duration;

@ConfigurationProperties(prefix = "resilience")
@Data
public class ResilienceProperties {
    private CircuitBreaker circuitBreaker = new CircuitBreaker();
    private Retry retry = new Retry();
    private Bulkhead bulkhead = new Bulkhead();
    private TimeLimiter timeLimiter = new TimeLimiter();
    private RateLimiter rateLimiter = new RateLimiter();

    @Data
    public static class CircuitBreaker {
        private int failureRateThreshold = 50;
        private int slowCallRateThreshold = 50;
        private Duration slowCallDurationThreshold = Duration.ofSeconds(2);
        private Duration waitDurationInOpenState = Duration.ofSeconds(30);
        private int permittedNumberOfCallsInHalfOpenState = 3;
        private int slidingWindowSize = 10;
        private int minimumNumberOfCalls = 5;
    }

    @Data
    public static class Retry {
        private int maxAttempts = 3;
        private Duration waitDuration = Duration.ofMillis(500);
        private boolean enableExponentialBackoff = true;
        private double backoffMultiplier = 2.0;
    }

    @Data
    public static class Bulkhead {
        private int maxConcurrentCalls = 20;
        private Duration maxWaitDuration = Duration.ofMillis(500);
    }

    @Data
    public static class TimeLimiter {
        private Duration timeoutDuration = Duration.ofSeconds(3);
    }

    @Data
    public static class RateLimiter {
        private int limitForPeriod = 10;
        private Duration limitRefreshPeriod = Duration.ofSeconds(1);
        private Duration timeoutDuration = Duration.ofSeconds(2);
    }
}

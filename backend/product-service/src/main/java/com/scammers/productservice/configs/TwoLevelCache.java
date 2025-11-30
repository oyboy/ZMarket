package com.scammers.productservice.configs;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.decorators.Decorators;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.data.redis.core.RedisTemplate;

import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.function.Supplier;

public class TwoLevelCache implements Cache {
    private final String name;
    private final Cache l1;
    private final RedisTemplate<String, Object> redisTemplate;
    private final CircuitBreaker redisCB;
    private final Logger log = LoggerFactory.getLogger(TwoLevelCache.class);

    public TwoLevelCache(String name,
                         Cache l1,
                         RedisTemplate<String, Object> redisTemplate,
                         CircuitBreaker redisCB) {
        this.name = name;
        this.l1 = l1;
        this.redisTemplate = redisTemplate;
        this.redisCB = redisCB;
    }

    private String buildKey(Object key) {
        return name + "::" + String.valueOf(key);
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public Object getNativeCache() {
        return this;
    }

    @Override
    public ValueWrapper get(Object key) {
        // 1) try L1
        if (l1 != null) {
            ValueWrapper v = l1.get(key);
            if (v != null) return v;
        }

        // 2) try L2 (Redis) with circuit breaker
        String redisKey = buildKey(key);
        Supplier<Object> supplier = () -> {
            try {
                return redisTemplate.opsForValue().get(redisKey);
            } catch (Exception e) {
                log.warn("Redis read failed for key {}: {}", redisKey, e.getMessage());
                throw new RuntimeException(e);
            }
        };

        Object value = null;
        try {
            value = Decorators.ofSupplier(supplier)
                    .withCircuitBreaker(redisCB)
                    .get()
            ;
        } catch (Exception e) {
            // Circuit open or redis error
            log.debug("Redis unavailable for key {}, falling back to DB (no value)", redisKey);
        }

        if (value != null) {
            // populate L1
            try { if (l1 != null) l1.put(key, value); } catch (Exception ex) { log.warn("L1 put failed: {}", ex.getMessage()); }
            Object finalValue = value;
            return () -> finalValue;
        }

        return null;
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> T get(Object key, Class<T> type) {
        ValueWrapper vw = get(key);
        if (vw == null) return null;
        Object val = vw.get();
        if (type != null && !type.isInstance(val)) return null;
        return (T) val;
    }

    @Override
    public <T> T get(Object key, java.util.concurrent.Callable<T> valueLoader) {
        // try get, if null use valueLoader and populate both L2 and L1
        ValueWrapper vw = get(key);
        if (vw != null) return (T) vw.get();

        try {
            T val = valueLoader.call();
            if (val != null) put(key, val);
            return val;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void put(Object key, Object value) {
        if (l1 != null) {
            l1.put(key, value);
        }

        CompletableFuture.runAsync(() -> {
            try {
                Supplier<Void> writer = () -> {
                    redisTemplate.opsForValue().set(buildKey(key), value, Duration.ofMinutes(10));
                    return null;
                };
                Decorators.ofSupplier(writer).withCircuitBreaker(redisCB).get();
            } catch (Exception e) {
                log.warn("Async Redis put failed for key {}: {}", buildKey(key), e.getMessage());
            }
        });
    }

    @Override
    public ValueWrapper putIfAbsent(Object key, Object value) {
        ValueWrapper existing = get(key);
        if (existing != null) return existing;
        put(key, value);
        return null;
    }

    @Override
    public void evict(Object key) {
        String redisKey = buildKey(key);
        try {
            Decorators.ofSupplier(() -> {
                try { redisTemplate.delete(redisKey); } catch (Exception e) { throw new RuntimeException(e); }
                return null;
            }).withCircuitBreaker(redisCB).get();
        } catch (Exception e) {
            log.warn("Redis evict failed {}", redisKey);
        }
        try { if (l1 != null) l1.evict(key); } catch (Exception ex) { log.warn("L1 evict failed: {}", ex.getMessage()); }
    }

    @Override
    public void clear() {
        // clear L1
        try { if (l1 != null) l1.clear(); } catch (Exception ex) { log.warn("L1 clear failed: {}", ex.getMessage()); }
        // attempt to clear L2: be careful — may be expensive; we'll not flush whole DB here
        log.debug("clear() invoked on TwoLevelCache: not flushing L2 (dangerous) by default");
    }
}
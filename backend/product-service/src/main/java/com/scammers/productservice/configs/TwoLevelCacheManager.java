package com.scammers.productservice.configs;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.core.RedisTemplate;

import java.util.Collection;
import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class TwoLevelCacheManager implements CacheManager {
    private final CacheManager l1Manager;
    private final RedisTemplate<String, Object> redisTemplate;
    private final CircuitBreaker redisCB;
    private final Set<String> cacheNames = ConcurrentHashMap.newKeySet();


    public TwoLevelCacheManager(CacheManager l1Manager,
                                RedisTemplate<String, Object> redisTemplate,
                                CircuitBreaker redisCB) {
        this.l1Manager = l1Manager;
        this.redisTemplate = redisTemplate;
        this.redisCB = redisCB;
    }


    @Override
    public Cache getCache(String name) {
        cacheNames.add(name);
        return new TwoLevelCache(name, l1Manager.getCache(name), redisTemplate, redisCB);
    }


    @Override
    public Collection<String> getCacheNames() {
        return Collections.unmodifiableSet(cacheNames);
    }
}

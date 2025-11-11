package com.scammers.productservice.exceptions;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.interceptor.CacheErrorHandler;

@Slf4j
public class CustomCacheErrorHandler implements CacheErrorHandler {
    @Override
    public void handleCacheGetError(RuntimeException e, Cache cache, Object key) {
        log.warn("Redis GET failed (cache={}, key={}). Fallback to DB.", cache.getName(), key, e);
    }

    @Override
    public void handleCachePutError(RuntimeException e, Cache cache, Object key, Object value) {
        log.warn("Redis PUT failed (cache={}, key={}).", cache.getName(), key, e);
    }

    @Override
    public void handleCacheEvictError(RuntimeException e, Cache cache, Object key) {
        log.warn("Redis EVICT failed (cache={}, key={}).", cache.getName(), key, e);
    }

    @Override
    public void handleCacheClearError(RuntimeException e, Cache cache) {
        log.warn("Redis CLEAR failed (cache={}).", cache.getName(), e);
    }
}

package com.scammers.commonresilience;

import io.github.resilience4j.ratelimiter.RequestNotPermitted;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.function.Supplier;

@Aspect
@Slf4j
public class ResilienceAspect {

    private final ResilienceDecorator decorator;

    public ResilienceAspect(ResilienceDecorator decorator) {
        this.decorator = decorator;
    }
    @Around("@within(com.scammers.commonresilience.Resilient) || @annotation(com.scammers.commonresilience.Resilient)")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        log.debug("ResilienceAspect: around called for {}", pjp.getSignature());
        Method method = ((MethodSignature) pjp.getSignature()).getMethod();

        Resilient resilient = AnnotationUtils.findAnnotation(method, Resilient.class);
        if (resilient == null) {
            resilient = AnnotationUtils.findAnnotation(pjp.getTarget().getClass(), Resilient.class);
        }

        String instanceName = resolveInstanceName(pjp, resilient);

        Supplier<Object> supplier = () -> {
            try {
                return pjp.proceed();
            } catch (Throwable e) {
                throw new RuntimeException(e);
            }
        };

        Supplier<Object> decorated = decorator.decorate(instanceName, supplier);

        try {
            return decorated.get();
        } catch (RuntimeException ex) {
            Throwable cause = ex.getCause();
            if (cause != null) {
                if (cause instanceof RequestNotPermitted ||
                        cause instanceof CallNotPermittedException) {
                    throw cause;
                }
                throw cause;
            }
            throw ex;
        }
    }

    private String resolveInstanceName(ProceedingJoinPoint pjp, Resilient resilient) {
        if (resilient != null && !resilient.value().isBlank()) {
            return resilient.value();
        }
        return pjp.getSignature().toShortString();
    }
}
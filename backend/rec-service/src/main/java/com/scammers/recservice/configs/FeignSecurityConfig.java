package com.scammers.recservice.configs;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.AbstractOAuth2Token;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

@Configuration
public class FeignSecurityConfig {
    @Bean
    public RequestInterceptor bearerTokenRelayInterceptor() {
        return template -> {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null) return;

            String token = null;

            if (auth instanceof JwtAuthenticationToken jwtAuth) {
                token = jwtAuth.getToken().getTokenValue();
            } else if (auth.getCredentials() instanceof AbstractOAuth2Token oauth2Token) {
                token = oauth2Token.getTokenValue();
            }

            if (token != null && !token.isBlank()) {
                template.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
            }
        };
    }
}
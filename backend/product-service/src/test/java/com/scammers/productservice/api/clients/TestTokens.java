package com.scammers.productservice.api.clients;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

public final class TestTokens {
    public static final String SELLER_TOKEN = "test-token-seller";
    public static final String OTHER_SELLER_TOKEN = "test-token-other-seller";
    public static final String BUYER_TOKEN = "test-token-buyer";
    public static final String ADMIN_TOKEN = "test-token-admin";

    private TestTokens() {
    }

    public static void register(JwtDecoder decoder, UUID sellerId, UUID otherSellerId) {
        when(decoder.decode(eq(SELLER_TOKEN))).thenReturn(jwt(sellerId, "seller"));
        when(decoder.decode(eq(OTHER_SELLER_TOKEN))).thenReturn(jwt(otherSellerId, "seller"));
        when(decoder.decode(eq(BUYER_TOKEN))).thenReturn(jwt(UUID.randomUUID(), "buyer"));
        when(decoder.decode(eq(ADMIN_TOKEN))).thenReturn(jwt(UUID.randomUUID(), "admin"));
    }

    public static Jwt jwt(UUID userId, String... roles) {
        return Jwt.withTokenValue("test-token")
                .header("alg", "none")
                .subject(userId.toString())
                .claim("realm_access", Map.of("roles", List.of(roles)))
                .claim("preferred_username", "test-user")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .build();
    }
}

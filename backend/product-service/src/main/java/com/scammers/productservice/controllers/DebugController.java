package com.scammers.productservice.controllers;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/debug")
public class DebugController {

    @GetMapping("/token-info")
    public Map<String, Object> getTokenInfo(JwtAuthenticationToken authentication) {
        Jwt jwt = authentication.getToken();

        Map<String, Object> result = new HashMap<>();
        result.put("subject", jwt.getSubject());
        result.put("username", jwt.getClaimAsString("preferred_username"));
        result.put("roles", jwt.getClaimAsStringList("roles"));
        result.put("realm_access", jwt.getClaim("realm_access"));
        result.put("all_claims", jwt.getClaims());

        // Какие authorities видит Spring Security
        result.put("authorities", authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()));

        return result;
    }
}
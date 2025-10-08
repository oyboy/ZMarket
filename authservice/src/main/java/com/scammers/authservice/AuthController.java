package com.scammers.authservice;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {
    static class LoginRequest {
        @JsonProperty("username")
        public String username;
        @JsonProperty("password")
        public String password;
    }

    static class TokenResponse {
        @JsonProperty("access_token")
        public String access_token;

        @JsonProperty("refresh_token")
        public String refresh_token;

        @JsonProperty("expires_in")
        public int expires_in;
        public String getAccess_token() { return access_token; }
        public String getRefresh_token() { return refresh_token; }
        public int getExpires_in() { return expires_in; }
    }

    @Autowired
    private RestTemplate restTemplate;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "password");
        params.add("client_id", "market-frontend");
        params.add("client_secret", "xB1D8FSu9p7N6GcOUJQ7mv9gDxPUKNmV");
        params.add("username", request.username);
        params.add("password", request.password);
        params.add("scope", "openid profile email");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(params, headers);

        String tokenUrl = "http://localhost:8085/realms/master/protocol/openid-connect/token";

        ResponseEntity<TokenResponse> response = restTemplate.postForEntity(tokenUrl, entity, TokenResponse.class);

        if (response.getStatusCode() == HttpStatus.OK) {
            TokenResponse token = response.getBody();
            return ResponseEntity.ok(Map.of(
                    "access_token", token.access_token,
                    "refresh_token", token.refresh_token,
                    "expires_in", token.expires_in
            ));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials"));
        }
    }

    /*@PostMapping("/refresh")
    public ResponseEntity<String> refresh(@RequestBody Map<String, String> request) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "refresh_token");
        params.add("client_id", "my-client");
        params.add("client_secret", "mysecret");
        params.add("refresh_token", request.get("refresh_token"));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(params, headers);

        String tokenUrl = "http://localhost:8085/realms/master/protocol/openid-connect/token";
        ResponseEntity<TokenResponse> response = restTemplate.postForEntity(tokenUrl, entity, TokenResponse.class);

        if (response.getStatusCode() == HttpStatus.OK) {
            return ResponseEntity.ok(response.getBody().access_token);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }*/
}

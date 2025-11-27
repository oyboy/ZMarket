package com.scammers.userservice.services;

import com.scammers.userservice.exceptions.KeycloakOperationException;
import com.scammers.userservice.exceptions.UserAlreadyExistsException;
import com.scammers.userservice.models.BuyerProfile;
import com.scammers.userservice.models.SellerProfile;
import com.scammers.userservice.models.User;
import com.scammers.userservice.models.enums.VerificationStatus;
import com.scammers.userservice.models.requests.CompanyRegistrationRequest;
import com.scammers.userservice.models.requests.UserRegistrationRequest;
import com.scammers.userservice.repositories.BuyerProfileRepository;
import com.scammers.userservice.repositories.SellerProfileRepository;
import com.scammers.userservice.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class KeycloakUserService {
    @Value("${keycloak.realm}")
    private String realm;

    private final Keycloak keycloak;
    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;

    private static final String USER_ROLE = "USER";

    @Transactional
    public UUID registerUser(UserRegistrationRequest req) {
        UserRepresentation user = new UserRepresentation();
        user.setUsername(req.email().toLowerCase());
        user.setEmail(req.email().toLowerCase());
        user.setFirstName(req.firstName());
        user.setLastName(req.lastName());
        user.setEnabled(true);
        user.setEmailVerified(false);

        String keycloakUserId;

        try (Response response = keycloak.realm(realm).users().create(user)) {
            if (response.getStatus() == 201) {
                String location = response.getHeaderString("Location");
                keycloakUserId = location.substring(location.lastIndexOf("/") + 1);
            } else if (response.getStatus() == 409) {
                throw new UserAlreadyExistsException("Пользователь с email " + req.email() + " уже существует");
            } else {
                String body = response.readEntity(String.class);
                throw new KeycloakOperationException("Ошибка создания в Keycloak: " + response.getStatus() + " " + body);
            }
        }

        UUID uuid = UUID.fromString(keycloakUserId);

        try {
            saveUserToDatabase(uuid, req);

            CredentialRepresentation credential = new CredentialRepresentation();
            credential.setTemporary(false);
            credential.setType(CredentialRepresentation.PASSWORD);
            credential.setValue(req.password());
            keycloak.realm(realm).users().get(keycloakUserId).resetPassword(credential);

            assignRole(keycloakUserId, USER_ROLE);

            return uuid;

        } catch (Exception e) {
            keycloak.realm(realm).users().get(keycloakUserId).remove();
            throw e;
        }
    }
    @Transactional
    protected void saveUserToDatabase(UUID uuid, UserRegistrationRequest req) {
        if (userRepository.existsById(uuid)) {
            throw new IllegalArgumentException("User already exists with ID: " + uuid);
        }

        User user = new User();
        user.setId(uuid);
        user.setEmail(req.email());
        user.setFirstName(req.firstName());
        user.setLastName(req.lastName());
        user.setCreatedAt(LocalDateTime.now());

        BuyerProfile buyerProfile = new BuyerProfile();
        buyerProfile.setUser(user);
        buyerProfile.setBonusPoints(0);

        user.setBuyerProfile(buyerProfile);

        userRepository.save(user);
    }

    @Transactional
    public void upgradeToSeller(UUID userId, CompanyRegistrationRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден"));

        if (user.getSellerProfile() != null && user.getSellerProfile().getStatus() == VerificationStatus.ACCEPTED) {
            throw new IllegalStateException("Пользователь уже является продавцом");
        }

        if (sellerProfileRepository.existsByInn(req.inn()))
            throw new IllegalStateException("Организация с таким инн уже зарегистрирована");

        SellerProfile sellerProfile = new SellerProfile();
        sellerProfile.setUser(user);
        sellerProfile.setCompanyName(req.name());
        sellerProfile.setInn(req.inn());
        sellerProfile.setStatus(VerificationStatus.PENDING);

        user.setSellerProfile(sellerProfile);

        userRepository.save(user);
    }

    private void assignRole(String keycloakUserId, String roleName) {
        RoleRepresentation role = keycloak.realm(realm)
                .roles()
                .get(roleName)
                .toRepresentation();

        keycloak.realm(realm)
                .users()
                .get(keycloakUserId)
                .roles()
                .realmLevel()
                .add(List.of(role));
    }
}
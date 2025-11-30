package com.scammers.userservice.services;

import com.scammers.userservice.models.SellerProfile;
import com.scammers.userservice.models.User;
import com.scammers.userservice.models.enums.VerificationStatus;
import com.scammers.userservice.repositories.BuyerProfileRepository;
import com.scammers.userservice.repositories.SellerProfileRepository;
import com.scammers.userservice.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.idm.RoleRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class AdminService {
    @Value("${keycloak.realm}")
    private String realm;

    private final Keycloak keycloak;
    private final SellerProfileRepository sellerProfileRepository;
    private final BuyerProfileRepository buyerProfileRepository;
    private final UserRepository userRepository;

    private static final String USER_ROLE = "USER";
    private static final String SELLER_ROLE = "SELLER";

    public void acceptSellerVerification(UUID sellerUuid, UUID adminUuid){
        SellerProfile profile = sellerProfileRepository.getSellerProfileById(sellerUuid)
                .orElseThrow(() -> new EntityNotFoundException("Заявка не найдена"));

        if (profile.getStatus() == VerificationStatus.ACCEPTED) {
            throw new IllegalStateException("Уже верифицирован");
        }

        profile.setStatus(VerificationStatus.ACCEPTED);
        profile.setVerifiedAt(LocalDateTime.now());
        profile.setVerifiedBy(adminUuid);

        buyerProfileRepository.removeBuyerProfileById(sellerUuid);
        User user = userRepository.findById(sellerUuid).get();
        user.setBuyerProfile(null);

        sellerProfileRepository.save(profile);

        switchRoleFromUserToSeller(sellerUuid.toString());
        log.info("Пользователь {} верифицирован как продавец админом {}", sellerUuid, adminUuid);
    }

    public void rejectSellerVerification(UUID sellerUserId, String reason) {
        SellerProfile profile = sellerProfileRepository.getSellerProfileById(sellerUserId)
                .orElseThrow(() -> new EntityNotFoundException("Заявка не найдена"));

        profile.setStatus(VerificationStatus.REJECTED);
        sellerProfileRepository.save(profile);

        log.info("Заявка пользователя {} отклонена админом по причине: {}", sellerUserId, reason);
    }

    public List<SellerProfile> getPendingSellerVerifications() {
        return sellerProfileRepository.findPendingProfiles();
    }
    public List<SellerProfile> getRejectedSellerVerifications(){
        return sellerProfileRepository.findRejectedProfiles();
    }

    public void switchRoleFromUserToSeller(String keycloakUserId) {
        UserResource userResource = keycloak.realm(realm).users().get(keycloakUserId);

        RoleRepresentation userRole = keycloak.realm(realm).roles().get(USER_ROLE).toRepresentation();
        userResource.roles().realmLevel().remove(List.of(userRole));

        RoleRepresentation sellerRole = keycloak.realm(realm).roles().get(SELLER_ROLE).toRepresentation();
        userResource.roles().realmLevel().add(List.of(sellerRole));
    }
}
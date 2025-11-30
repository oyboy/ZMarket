package com.scammers.userservice.repositories;

import com.scammers.userservice.models.SellerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SellerProfileRepository extends JpaRepository<SellerProfile, UUID> {
    @Query("SELECT p FROM SellerProfile p WHERE p.user.id = :sellerId")
    Optional<SellerProfile> getSellerProfileById(@Param("sellerId") UUID sellerId);

    @Query("SELECT p FROM SellerProfile p WHERE p.status = 'PENDING'")
    List<SellerProfile> findPendingProfiles();

    @Query("SELECT p FROM SellerProfile p WHERE p.status = 'REJECTED'")
    List<SellerProfile> findRejectedProfiles();

    Boolean existsByInn(String inn);

    Optional<SellerProfile> findByUserId(UUID userId);
}
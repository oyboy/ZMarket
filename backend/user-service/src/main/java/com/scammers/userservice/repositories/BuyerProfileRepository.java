package com.scammers.userservice.repositories;

import com.scammers.userservice.models.BuyerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface BuyerProfileRepository extends JpaRepository<BuyerProfile, UUID> {
    void removeBuyerProfileById(UUID id);

    @Query("SELECT bp FROM BuyerProfile bp JOIN FETCH bp.user WHERE bp.user.id = :userId")
    Optional<BuyerProfile> findByUserId(@Param("userId") UUID userId);
}

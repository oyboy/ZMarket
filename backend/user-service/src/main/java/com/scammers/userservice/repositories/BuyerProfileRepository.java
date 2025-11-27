package com.scammers.userservice.repositories;

import com.scammers.userservice.models.BuyerProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface BuyerProfileRepository extends JpaRepository<BuyerProfile, UUID> {
    void removeBuyerProfileById(UUID id);
}

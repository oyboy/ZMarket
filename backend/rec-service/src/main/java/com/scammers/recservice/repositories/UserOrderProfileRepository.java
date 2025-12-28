package com.scammers.recservice.repositories;

import com.scammers.recservice.models.UserOrderProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UserOrderProfileRepository extends JpaRepository<UserOrderProfile, UserOrderProfile.UserOrderProfileId> {

    List<UserOrderProfile> findTop5ByIdUserUuidOrderByOrdersCntDescLastOrderAtDesc(UUID userUuid);
}
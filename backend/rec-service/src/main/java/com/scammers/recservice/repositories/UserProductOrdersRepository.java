package com.scammers.recservice.repositories;

import com.scammers.recservice.models.UserProductOrders;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UserProductOrdersRepository extends JpaRepository<UserProductOrders, UserProductOrders.UserProductOrdersId> {

    List<UserProductOrders> findTop100ByIdUserUuidOrderByLastOrderAtDesc(UUID userUuid);
}
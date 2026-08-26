package com.scammers.recservice.repositories;

import com.scammers.recservice.models.ProcessedOrderEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

public interface ProcessedOrderEventRepository extends JpaRepository<ProcessedOrderEvent, UUID> {
}

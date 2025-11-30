package com.scammers.warehouseservice.repositories;

import com.scammers.warehouseservice.models.StockTransactions;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
@Repository
public interface StockTransactionRepository extends JpaRepository<StockTransactions, UUID> {
}

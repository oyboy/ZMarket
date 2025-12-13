package com.scammers.warehouseservice.repositories;

import com.scammers.warehouseservice.models.StockTransactions;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;
@Repository
public interface StockTransactionRepository extends JpaRepository<StockTransactions, UUID> {
    List<StockTransactions> findAllByProductId(UUID productId, Pageable pageable);
}

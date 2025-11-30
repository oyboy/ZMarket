package com.scammers.warehouseservice.repositories;

import com.scammers.warehouseservice.models.WarehouseItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;
@Repository
public interface WarehouseRepository extends JpaRepository<WarehouseItem, UUID> {
    Optional<WarehouseItem> findByProductId(UUID productId);

    @Modifying
    @Query("UPDATE WarehouseItem w SET w.quantityReserved = w.quantityReserved + :amount " +
            "WHERE w.productId = :productId " +
            "AND (w.quantityOnHand - w.quantityReserved) >= :amount")
    int reserveStock(@Param("productId") UUID productId, @Param("amount") int amount);

    @Modifying
    @Query("UPDATE WarehouseItem w SET w.quantityReserved = w.quantityReserved - :amount, " +
            "w.quantityOnHand = w.quantityOnHand - :amount " +
            "WHERE w.productId = :productId AND w.quantityReserved >= :amount")
    void commitStock(@Param("productId") UUID productId, @Param("amount") int amount);

    @Modifying
    @Query("UPDATE WarehouseItem w SET w.quantityReserved = w.quantityReserved - :amount " +
            "WHERE w.productId = :productId AND w.quantityReserved >= :amount")
    void releaseStock(@Param("productId") UUID productId, @Param("amount") int amount);
}
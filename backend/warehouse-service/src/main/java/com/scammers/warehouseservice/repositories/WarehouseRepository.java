package com.scammers.warehouseservice.repositories;

import com.scammers.warehouseservice.models.WarehouseItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
@Repository
public interface WarehouseRepository extends JpaRepository<WarehouseItem, UUID> {
    Optional<WarehouseItem> findByProductId(UUID productId);
    List<WarehouseItem> findAllByProductIdIn(Collection<UUID> ids);

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

    @Modifying
    @Transactional
    @Query(
            value = """
        UPDATE warehouse_item w
        SET quantity_reserved = w.quantity_reserved - c.qty,
            quantity_on_hand  = w.quantity_on_hand - c.qty
        FROM (
            SELECT UNNEST(:productIds) AS product_id,
                   UNNEST(:quantities) AS qty
        ) c
        WHERE w.product_id = c.product_id
        """,
            nativeQuery = true
    )
    void commitStockBatch(
            @Param("productIds") UUID[] productIds,
            @Param("quantities") Integer[] quantities
    );


    @Modifying
    @Transactional
    @Query(
            value = """
        UPDATE warehouse_item w
        SET quantity_reserved = w.quantity_reserved - c.qty
        FROM (
            SELECT UNNEST(:productIds) AS product_id,
                   UNNEST(:quantities) AS qty
        ) c
        WHERE w.product_id = c.product_id
        """,
            nativeQuery = true
    )
    void releaseStockBatch(
            @Param("productIds") UUID[] productIds,
            @Param("quantities") Integer[] quantities
    );

}
package com.scammers.recservice.repositories;

import com.scammers.recservice.models.ProductOrderStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ProductOrderStatsRepository extends JpaRepository<ProductOrderStats, UUID> {

    List<ProductOrderStats> findTop20ByOrderByOrdersCntDescLastOrderAtDesc();

    @Query("SELECT p FROM ProductOrderStats p ORDER BY p.ordersCnt DESC, p.lastOrderAt DESC")
    List<ProductOrderStats> findTopN(@Param("limit") int limit);

    @Query("""
        select p from ProductOrderStats p
        where p.manufacturerUuid = :sellerUuid
          and p.lastOrderAt between :from and :to
        order by p.ordersCnt desc, p.lastOrderAt desc
        """)
    List<ProductOrderStats> findBySellerAndPeriod(
            @Param("sellerUuid") UUID sellerUuid,
            @Param("from") Instant from,
            @Param("to") Instant to
    );
}
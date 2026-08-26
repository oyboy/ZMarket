package com.scammers.recservice.repositories;

import com.scammers.recservice.models.SellerProductDailyStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface SellerProductDailyStatsRepository
        extends JpaRepository<SellerProductDailyStats, SellerProductDailyStats.Id> {

    @Query("""
        select s from SellerProductDailyStats s
        where s.id.sellerUuid = :sellerId
          and s.id.productUuid = :productId
          and s.id.day between :from and :to
        order by s.id.day asc
        """)
    List<SellerProductDailyStats> findForProductAndPeriod(
            @Param("sellerId") UUID sellerId,
            @Param("productId") UUID productId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );
}

package com.scammers.recservice.services;

import com.scammers.recservice.models.ProductOrderStats;
import com.scammers.recservice.models.dtos.DailySalesPointDto;
import com.scammers.recservice.models.dtos.SellerProductSummaryDto;
import com.scammers.recservice.repositories.ProductOrderStatsRepository;
import com.scammers.recservice.repositories.SellerProductDailyStatsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SellerAnalyticsService {
    private final ProductOrderStatsRepository productStatsRepo;
    private final SellerProductDailyStatsRepository dailyStatsRepo;

    @Transactional(readOnly = true)
    public List<SellerProductSummaryDto> getTopProductsForSeller(
            UUID sellerId,
            Instant from,
            Instant to,
            int limit
    ) {
        List<ProductOrderStats> stats = productStatsRepo.findBySellerAndPeriod(sellerId, from, to);

        return stats.stream()
                .sorted(Comparator
                        .comparingLong(ProductOrderStats::getOrdersCnt).reversed()
                        .thenComparing(ProductOrderStats::getLastOrderAt).reversed())
                .limit(limit)
                .map(p -> new SellerProductSummaryDto(
                        p.getProductUuid(),
                        p.getOrdersCnt(),
                        p.getQuantitySum(),
                        p.getLastOrderAt()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DailySalesPointDto> getDailySalesForProduct(
            UUID sellerId,
            UUID productId,
            LocalDate from,
            LocalDate to
    ) {
        return dailyStatsRepo.findForProductAndPeriod(sellerId, productId, from, to)
                .stream()
                .map(d -> new DailySalesPointDto(
                        d.getId().getDay(),
                        d.getOrdersCnt(),
                        d.getQuantitySum()
                ))
                .toList();
    }
}

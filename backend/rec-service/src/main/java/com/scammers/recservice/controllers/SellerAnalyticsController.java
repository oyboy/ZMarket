package com.scammers.recservice.controllers;

import com.scammers.recservice.models.responses.ApiResponse;
import com.scammers.recservice.models.dtos.DailySalesPointDto;
import com.scammers.recservice.models.dtos.SellerProductSummaryDto;
import com.scammers.recservice.services.SellerAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/seller-analytics")
@RequiredArgsConstructor
public class SellerAnalyticsController {
    private final SellerAnalyticsService analyticsService;

    @GetMapping("/{seller_id}/top-products")
    @PreAuthorize("hasAuthority('SELLER')")
    public ApiResponse<List<SellerProductSummaryDto>> getTopProducts(
            @PathVariable("seller_id") UUID sellerId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "10") int limit
    ) {
        Instant now = Instant.now();
        Instant fromTs = from != null ? Instant.parse(from) : now.minus(90, ChronoUnit.DAYS);
        Instant toTs   = to != null ? Instant.parse(to)   : now;

        int safeLimit = Math.max(1, Math.min(limit, 100));

        return ApiResponse.ok(
                analyticsService.getTopProductsForSeller(sellerId, fromTs, toTs, safeLimit)
        );
    }

    @GetMapping("/{seller_id}/products/{product_id}/daily-sales")
    @PreAuthorize("hasAuthority('SELLER')")
    public ApiResponse<List<DailySalesPointDto>> getDailySales(
            @PathVariable("seller_id") UUID sellerId,
            @PathVariable("product_id") UUID productId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to
    ) {
        LocalDate now = LocalDate.now(ZoneOffset.UTC);
        LocalDate fromDate = from != null ? LocalDate.parse(from) : now.minusDays(30);
        LocalDate toDate   = to != null ? LocalDate.parse(to)   : now;

        return ApiResponse.ok(
                analyticsService.getDailySalesForProduct(sellerId, productId, fromDate, toDate)
        );
    }
}

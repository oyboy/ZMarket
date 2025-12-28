package com.scammers.productservice.controllers;

import com.scammers.productservice.models.dtos.DailySalesPointDto;
import com.scammers.productservice.models.dtos.SellerProductWithStatsDto;
import com.scammers.productservice.models.responses.ApiResponse;
import com.scammers.productservice.services.SellerStatsFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/seller/stats")
@RequiredArgsConstructor
public class SellerStatsController {
    private final SellerStatsFacade sellerStatsFacade;

    /**
     * Топ товаров продавца по количеству заказов за период.
     *
     * GET /api/v1/seller/stats/top-products?from=2025-01-01&to=2025-02-01&limit=10
     *
     * from/to — опциональны, по умолчанию последние 90 дней.
     */
    @GetMapping("/top-products")
    @PreAuthorize("hasAuthority('SELLER')")
    public ApiResponse<List<SellerProductWithStatsDto>> getTopProducts(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "10") int limit
    ) {
        UUID sellerId = UUID.fromString(jwt.getSubject());

        LocalDate now = LocalDate.now(ZoneOffset.UTC);
        LocalDate fromDate = (from != null) ? from : now.minusDays(90);
        LocalDate toDate   = (to   != null) ? to   : now;

        // перевод в Instant: [from 00:00; to 23:59:59.999...]
        Instant fromTs = fromDate.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant toTs   = toDate.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant().minusNanos(1);

        int safeLimit = Math.max(1, Math.min(limit, 100));

        List<SellerProductWithStatsDto> result =
                sellerStatsFacade.getTopProductsForSeller(sellerId, fromTs, toTs, safeLimit);

        return ApiResponse.ok(result);
    }

    /**
     * Дневная статистика по конкретному товару продавца (для графика).
     *
     * GET /api/v1/seller/stats/products/{product_uuid}/daily-sales?from=2025-01-01&to=2025-02-01
     *
     * from/to — опциональны, по умолчанию последние 30 дней.
     */
    @GetMapping("/products/{product_uuid}/daily-sales")
    @PreAuthorize("hasAuthority('SELLER')")
    public ApiResponse<List<DailySalesPointDto>> getDailySalesForProduct(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable("product_uuid") UUID productUuid,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        UUID sellerId = UUID.fromString(jwt.getSubject());

        LocalDate now = LocalDate.now(ZoneOffset.UTC);
        LocalDate fromDate = (from != null) ? from : now.minusDays(30);
        LocalDate toDate   = (to   != null) ? to   : now;

        List<DailySalesPointDto> points =
                sellerStatsFacade.getDailySales(sellerId, productUuid, fromDate, toDate);

        return ApiResponse.ok(points);
    }
}

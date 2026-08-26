package com.scammers.productservice.services;

import com.scammers.productservice.controllers.RecommendationClient;
import com.scammers.productservice.models.Product;
import com.scammers.productservice.models.dtos.DailySalesPointDto;
import com.scammers.productservice.models.dtos.SellerProductSummaryDto;
import com.scammers.productservice.models.dtos.SellerProductWithStatsDto;
import com.scammers.productservice.repositories.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SellerStatsFacade {
    private final RecommendationClient analyticsClient;
    private final ProductRepository productRepository;

    public List<SellerProductWithStatsDto> getTopProductsForSeller(
            UUID sellerId,
            Instant from,
            Instant to,
            int limit
    ) {
        List<SellerProductSummaryDto> stats = analyticsClient.getTopProducts(
                sellerId,
                from.toString(),
                to.toString(),
                limit
        ).data();
        if (stats.isEmpty()) return List.of();

        List<UUID> ids = stats.stream()
                .map(SellerProductSummaryDto::productId)
                .toList();

        List<Product> products = productRepository.findByUUIDs(ids);
        Map<UUID, Product> byUuid = products.stream()
                .collect(Collectors.toMap(Product::getProductUUID, p -> p));

        return stats.stream()
                .map(s -> {
                    Product p = byUuid.get(s.productId());
                    if (p == null) return null;
                    return new SellerProductWithStatsDto(
                            p,
                            s.ordersCount(),
                            s.quantitySum(),
                            s.lastOrderAt()
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }

    public List<DailySalesPointDto> getDailySales(
            UUID sellerId, UUID productId, LocalDate from, LocalDate to) {
        return analyticsClient.getDailySales(
                sellerId,
                productId,
                from.toString(),
                to.toString()
        ).data();
    }
}
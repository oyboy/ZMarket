package com.scammers.productservice.services;

import com.scammers.productservice.controllers.RecommendationClient;
import com.scammers.productservice.models.Product;
import com.scammers.productservice.repositories.ProductRepository;
import jakarta.ws.rs.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductRecommendationsFacade {
    private final RecommendationClient recommendationClient;
    private final ProductRepository productRepository;

    public List<Product> getPopularProducts(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        List<UUID> ids = recommendationClient.getPopular(safeLimit).data();
        return fetchAvailableProductsPreservingOrder(ids, safeLimit);
    }

    public List<Product> getPersonalRecommendations(UUID userId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        List<UUID> ids = recommendationClient.getForUser(userId, safeLimit).data();
        return fetchAvailableProductsPreservingOrder(ids, safeLimit);
    }

    private List<Product> fetchAvailableProductsPreservingOrder(List<UUID> ids, int limit) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }

        List<Product> products = productRepository.findByUUIDs(ids);

        Map<UUID, Product> byUuid = products.stream()
                .collect(Collectors.toMap(Product::getProductUUID, p -> p));

        return ids.stream()
                .map(byUuid::get)
                .filter(Objects::nonNull)
                .filter(p -> p.getStock() != null && p.getStock() > 0)
                .limit(limit)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Product> getProductsFromSameManufacturer(UUID productId, int limit) {
        Product product = productRepository.findByUUID(productId);
        if (product == null) throw new NotFoundException("Product not found");

        UUID sellerId = product.getSellerId();

        List<Product> products = productRepository
                .findTop6BySellerUUIDAndIdNotOrderByCreatedAtDesc(sellerId, productId);

        return products.stream()
                .limit(limit)
                .toList();
    }
}

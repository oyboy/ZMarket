package com.scammers.productservice.services;

import com.scammers.productservice.configs.SecurityUtils;
import com.scammers.productservice.controllers.WarehouseClient;
import com.scammers.productservice.models.Product;
import com.scammers.productservice.models.requests.ProductCreateRequest;
import com.scammers.productservice.models.requests.StockOperationRequest;
import com.scammers.productservice.repositories.CategoryRepository;
import com.scammers.productservice.repositories.ProductRepository;
import jakarta.ws.rs.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {
    private final ProductRepository productRepository;
    private final UserClient userClient;
    private final WarehouseClient warehouseClient;
    private final CategoryRepository categoryRepository;


    @Cacheable(value = "ProductService::findByUUID",key = "#uuid")
    public Optional<Product> findByUUID(UUID uuid) {
        return Optional.ofNullable(productRepository.findByUUID(uuid));
    }

    public Optional<List<Product>> getProductsForSeller(UUID ownerUUID) {
        return Optional.ofNullable(productRepository.getProductsForSellerByUUID(ownerUUID));
    }

    @Transactional
    public Optional<Product> addProduct(ProductCreateRequest request) {
        validateProductParams(request);

        UUID sellerId = SecurityUtils.getCurrentUserUUID();
        UUID productId = UUID.randomUUID();

        if (request.stock() != null && request.stock() > 0) {
            warehouseClient.addStock(new StockOperationRequest(productId, request.stock().intValue()));
        }
        if (!categoryRepository.existsById(request.categoryId())) {
            throw new RuntimeException("Категория не найдена");
        }

        Product product = Product.builder()
                .productUUID(productId)
                .title(request.title())
                .description(request.description())
                .price(request.price())
                .stock(request.stock())
                .categoryId(request.categoryId())
                .attributes(request.attributes() != null ? request.attributes() : new HashMap<>())
                .sellerId(sellerId)
                .build();

        Product saved = productRepository.save(product);
        return Optional.of(saved);
    }

    public Page<Product> findPaginated(int page, int size, String orderBy, Long categoryId) {
        if (page < 0) page = 0;
        if (size < 1) size = 20;
        if (size > 100) size = 100;

        int offset = page * size;

        List<Product> products = productRepository.findByOffsetSize(offset, size, orderBy, categoryId);

        Long total = productRepository.getTotalCountOfProducts(categoryId);

        return new PageImpl<>(products, PageRequest.of(page, size), total);
    }

    @Transactional
    @Caching(put = {
            @CachePut(value = "ProductService::findByUUID", key = "#uuid"),
    })
    public Optional<Product> updateProduct(UUID uuid, ProductCreateRequest req) throws IllegalArgumentException {
        validateProductParams(req);
        Product current = productRepository.findByUUID(uuid);
        if (current == null) throw new NotFoundException("Product not found");

        current.setTitle(req.title());
        current.setDescription(req.description());
        current.setPrice(req.price());

        if (req.categoryId() != null && !categoryRepository.existsById(req.categoryId())) {
            throw new RuntimeException("Category not found");
        }
        if (req.categoryId() != null) {
            current.setCategoryId(req.categoryId());
        }
        if (req.attributes() != null) {
            current.setAttributes(req.attributes());
        }

        Product updated = productRepository.update(current);
        return Optional.of(updated);
    }

    private void validateProductParams(ProductCreateRequest request) throws IllegalArgumentException {
        if (request.price() < 0.0)
            throw new IllegalArgumentException("Цена не может быть меньше 0");
        if (request.title().isEmpty() || request.description().isEmpty())
            throw new IllegalArgumentException("Название товара и его описание должны быть заполнены");
    }

    @Cacheable(value = "ProductService::isOwner", key = "#productUuid + '.' + T(com.scammers.productservice.configs.SecurityUtils).getCurrentUserUUID()")
    public boolean isOwner(UUID productUuid) {
        UUID currentUuid = SecurityUtils.getCurrentUserUUID();
        UUID sellerUuid = productRepository.getSellerUUID(productUuid);
        return currentUuid.equals(sellerUuid);
    }

    @CacheEvict(value = "ProductService::findByUUID", key = "#productId")
    public void updateStockFromKafka(UUID productId, Long newStock) {
        productRepository.updateStock(productId, newStock);
    }
}
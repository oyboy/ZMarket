package com.scammers.productservice.services;

import com.scammers.productservice.configs.SecurityUtils;
import com.scammers.productservice.models.Product;
import com.scammers.productservice.models.ProductCreateRequest;
import com.scammers.productservice.repositories.ProductRepository;
import jakarta.ws.rs.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final UserClient userClient;
//    private final KafkaTemplate<String, ProductEvent> kafkaTemplate;


    public Optional<Product> findByUUID(UUID uuid) {
        return Optional.ofNullable(productRepository.findByUUID(uuid));
    }

    @Transactional
    public Optional<Product> addProduct(ProductCreateRequest request) throws IllegalArgumentException {
        validateProductParams(request);

        UUID sellerid = SecurityUtils.getCurrentUserUUID();
        System.out.println("Current sellerid: " + sellerid);
        /*if (!userClient.exists(sellerid)) {
            throw new IllegalArgumentException("Seller does not exist");
        }*/

        Product product = Product.builder()
                .productUUID(UUID.randomUUID())
                .title(request.title())
                .description(request.description())
                .stock(request.stock())
                .price(request.price())
                .rating(0.0)
                .sellerId(sellerid)
                .build();

        Product saved = productRepository.save(product);
        //kafkaTemplate.send("product.created", new ProductEvent(saved.getProductUuid().toString(), "CREATED"));

        return Optional.of(saved);
    }

    public Page<Product> findPaginated(int page, int size, String orderBy) {
        if (page < 0) page = 0;
        if (size < 1) size = 20;
        if (size > 100) size = 100;

        int offset = page * size;

        List<Product> products = productRepository.findByOffsetSize(offset, size, orderBy);

        Long total = productRepository.getTotalCountOfProducts();

        return new PageImpl<>(products, PageRequest.of(page, size), total);
    }

    @Transactional
    public Optional<Product> updateProduct(UUID uuid, ProductCreateRequest req) throws IllegalArgumentException {
        validateProductParams(req);

        Product current = productRepository.findByUUID(uuid);
        if (current == null) throw new NotFoundException("Product not found");

        UUID currentUser = SecurityUtils.getCurrentUserUUID();
        if (!current.getSellerId().equals(currentUser) && !SecurityUtils.hasRole("SELLER")) {
            throw new AccessDeniedException("Not owner");
        }

        current.setTitle(req.title());
        current.setDescription(req.description());
        current.setPrice(req.price());
        current.setStock(req.stock());

        Product updated = productRepository.update(current);
        //kafkaTemplate.send("product.updated", new ProductEvent(updated.getProductUuid().toString(), "UPDATED"));
        return Optional.of(updated);
    }

    private void validateProductParams(ProductCreateRequest request) throws IllegalArgumentException {
        if (request.price() < 0.0)
            throw new IllegalArgumentException("Цена не может быть меньше 0");
        if (request.title().isEmpty() || request.description().isEmpty())
            throw new IllegalArgumentException("Название товара и его описание должны быть заполнены");
        if (request.stock() < 1)
            throw new IllegalArgumentException("В наличии должен быть хотя бы один товар");
    }

    public boolean isOwner(UUID productUuid) {
        UUID currentUuid = SecurityUtils.getCurrentUserUUID();
        UUID sellerUuid = productRepository.getSellerUUID(productUuid);
        return currentUuid.equals(sellerUuid);
    }
}
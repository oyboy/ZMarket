package com.scammers.productservice.controllers;

import com.scammers.productservice.models.Product;
import com.scammers.productservice.models.requests.ProductCreateRequest;
import com.scammers.productservice.services.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/products")
public class ProductController {
    private final ProductService service;

    @GetMapping("/{uuid}")
    public ResponseEntity<Product> getProductById(@PathVariable UUID uuid) {
        return ResponseEntity.of(service.findByUUID(uuid));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasAuthority('SELLER')")
    public ResponseEntity<List<Product>> myProducts(@AuthenticationPrincipal Jwt jwt) {
        UUID currentSellerUuid = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(
                service.getProductsForSeller(currentSellerUuid)
                        .orElseThrow(() -> new IllegalStateException("Failed to find products"))
        );
    }

    @GetMapping
    public ResponseEntity<List<Product>> findAllPaginated(@RequestParam(value = "page", defaultValue = "0") int page,
                                                          @RequestParam(value = "size", defaultValue = "20") int size,
                                                          @RequestParam(value = "order", defaultValue = "id") String orderBy
    ) {
        Page<Product> resultPage = service.findPaginated(page, size, orderBy);

        return ResponseEntity.ok(resultPage.getContent());
    }

    @PostMapping
    public ResponseEntity<Product> addProduct(@Valid @RequestBody ProductCreateRequest productCreateRequest) {
        return ResponseEntity.ok(
                service.addProduct(productCreateRequest)
                        .orElseThrow(() -> new IllegalStateException("Failed to add product"))
        );
    }

    @PatchMapping("/{uuid}")
    @PreAuthorize("@productService.isOwner(#uuid)")
    public ResponseEntity<Product> updateProduct(@PathVariable UUID uuid,
            @Valid @RequestBody ProductCreateRequest productCreateRequest
    ) {
        return ResponseEntity.ok(
                service.updateProduct(uuid, productCreateRequest)
                        .orElseThrow(() -> new IllegalStateException("Failed to update product"))
        );
    }
}
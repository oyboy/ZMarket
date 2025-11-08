package com.scammers.productservice;

import com.scammers.productservice.models.Product;
import com.scammers.productservice.models.ProductCreateRequest;
import com.scammers.productservice.services.ProductService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

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
}
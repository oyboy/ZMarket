package com.scammers.warehouseservice.controllers;

import com.scammers.warehouseservice.models.requests.StockRequest;
import com.scammers.warehouseservice.models.responses.ApiResponse;
import com.scammers.warehouseservice.models.responses.StockInfoResponse;
import com.scammers.warehouseservice.repositories.WarehouseRepository;
import com.scammers.warehouseservice.services.WarehouseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/warehouse")
@RequiredArgsConstructor
public class SellerWarehouseController {
    private final WarehouseRepository warehouseRepository;
    private final WarehouseService warehouseService;

    @PostMapping("/add")
    public ApiResponse<Void> addStock(@RequestBody @Valid StockRequest request) {
        warehouseService.addStock(request.productId(), request.quantity());
        return ApiResponse.success("Stock added successfully");
    }

    @GetMapping("/{productId}")
    public ApiResponse<StockInfoResponse> getStockInfo(@PathVariable UUID productId) {
        StockInfoResponse response = warehouseRepository.findByProductId(productId)
                .map(item -> new StockInfoResponse(
                        item.getProductId(),
                        item.getAvailable(),
                        item.getQuantityOnHand(),
                        item.getQuantityReserved()
                ))
                .orElse(new StockInfoResponse(productId, 0, 0, 0));

        return ApiResponse.ok(response);
    }
}
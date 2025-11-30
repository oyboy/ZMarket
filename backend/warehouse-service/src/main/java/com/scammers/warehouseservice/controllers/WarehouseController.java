package com.scammers.warehouseservice.controllers;

import com.scammers.warehouseservice.models.requests.StockRequest;
import com.scammers.warehouseservice.models.responses.ApiResponse;
import com.scammers.warehouseservice.services.WarehouseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/warehouse")
@RequiredArgsConstructor
public class WarehouseController {
    private final WarehouseService warehouseService;

    @PostMapping("/reserve")
    public ApiResponse<Void> reserve(@RequestBody @Valid StockRequest request) {
        boolean success = warehouseService.reserveStock(
                request.productId(), request.quantity(), request.orderId());

        return success
                ? ApiResponse.success("Stock reserved successfully")
                : ApiResponse.fail("Insufficient stock or already reserved");
    }

    @PostMapping("/commit")
    public ApiResponse<Void> commit(@RequestBody @Valid StockRequest request) {
        warehouseService.commitStock(request.productId(), request.quantity(), request.orderId());
        return ApiResponse.success("Stock committed successfully");
    }

    @PostMapping("/release")
    public ApiResponse<Void> release(@RequestBody @Valid StockRequest request) {
        warehouseService.releaseStock(request.productId(), request.quantity(), request.orderId());
        return ApiResponse.success("Stock released successfully");
    }
}
package com.scammers.orderservice.controllers;

import com.scammers.orderservice.models.requests.StockOperationRequest;
import com.scammers.orderservice.models.responses.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(
        name = "warehouse-service",
        url = "${services.warehouse-service.url}"
)
public interface WarehouseClient {
    @PostMapping("/api/v1/warehouse/reserve")
    ApiResponse<Void> reserve(@RequestBody StockOperationRequest request);

    @PostMapping("/api/v1/warehouse/release")
    ApiResponse<Void> release(@RequestBody StockOperationRequest request);
}

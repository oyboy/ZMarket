package com.scammers.productservice.controllers;

import com.scammers.productservice.models.requests.StockOperationRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(
        name = "warehouse-service",
        url = "${services.warehouse-service.url}"
)
public interface WarehouseClient {
    @PostMapping("/api/v1/warehouse/add")
    void addStock(@RequestBody StockOperationRequest request);
}

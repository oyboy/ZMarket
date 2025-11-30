package com.scammers.productservice.models.requests;

import java.util.UUID;

public record StockOperationRequest(UUID productId, int quantity) {}
package com.scammers.warehouseservice.models.responses;

import java.util.UUID;

public record StockInfoResponse(
        UUID productId,
        int available,
        int onHand,
        int reserved
) {}
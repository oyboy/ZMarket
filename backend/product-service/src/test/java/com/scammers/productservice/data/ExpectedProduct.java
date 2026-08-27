package com.scammers.productservice.data;

import com.scammers.productservice.models.requests.ProductCreateRequest;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

public final class ExpectedProduct {

    private ExpectedProduct() {
    }

    public static Map<String, Object> afterCreate(ProductCreateRequest request, UUID sellerId) {
        Map<String, Object> expected = new LinkedHashMap<>();
        expected.put("sellerId", sellerId.toString());
        expected.put("title", request.title());
        expected.put("description", request.description());
        expected.put("price", request.price());
        expected.put("categoryId", request.categoryId());
        expected.put("attributes", request.attributes() == null ? Map.of() : request.attributes());

        expected.put("stock", 0);
        expected.put("rating", 0.0);
        return expected;
    }

    public static String[] unpredictablePaths() {
        return new String[]{"id", "productUUID", "createdAt", "updatedAt"};
    }
}
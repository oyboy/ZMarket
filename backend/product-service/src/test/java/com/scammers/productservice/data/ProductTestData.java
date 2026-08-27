package com.scammers.productservice.data;

import com.scammers.productservice.models.Product;
import com.scammers.productservice.models.requests.ProductCreateRequest;
import io.qameta.allure.Step;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class ProductTestData {

    public static final String DEFAULT_TITLE = "Тестовый товар";
    public static final String DEFAULT_DESCRIPTION = "Описание тестового товара";
    public static final double DEFAULT_PRICE = 199.99;
    public static final long DEFAULT_STOCK = 10L;

    private ProductTestData() {
    }

    public static Product.ProductBuilder product() {
        return Product.builder()
                .productUUID(UUID.randomUUID())
                .sellerId(UUID.randomUUID())
                .title(DEFAULT_TITLE)
                .description(DEFAULT_DESCRIPTION)
                .price(DEFAULT_PRICE)
                .stock(DEFAULT_STOCK)
                .categoryId(1L)
                .attributes(new HashMap<>());
    }

    public static ProductCreateRequest createRequest(Long categoryId) {
        return new ProductCreateRequest(
                DEFAULT_TITLE, DEFAULT_DESCRIPTION, DEFAULT_PRICE, 0L, categoryId, Map.of());
    }

    public static ProductCreateRequest createRequest(String title, String description,
                                                     Double price, Long stock, Long categoryId) {
        return new ProductCreateRequest(title, description, price, stock, categoryId, Map.of());
    }

    public static ProductCreateRequest createRequest(String title, Double price, Long categoryId,
                                                     Map<String, Object> attributes) {
        return new ProductCreateRequest(
                title, DEFAULT_DESCRIPTION, price, 0L, categoryId, attributes);
    }

    @Step("Создать категорию \"{name}\"")
    public static Long insertCategory(JdbcTemplate jdbc, String name) {
        String slug = name.toLowerCase().replace(' ', '-') + "-" + UUID.randomUUID();
        return jdbc.queryForObject(
                "INSERT INTO categories(name, parent_id, slug) VALUES (?, NULL, ?) RETURNING id",
                Long.class, name, slug);
    }

    @Step("Создать товар \"{title}\" по цене {price}")
    public static UUID insertProduct(JdbcTemplate jdbc, Long categoryId, String title, double price) {
        return insertProduct(jdbc, categoryId, UUID.randomUUID(), title, price, DEFAULT_STOCK);
    }

    public static UUID insertProduct(JdbcTemplate jdbc, Long categoryId, UUID sellerId,
                                     String title, double price, long stock) {
        UUID productUuid = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO products(product_uuid, seller_id, title, description, price, stock, rating, category_id, attributes)
                VALUES (?, ?, ?, ?, ?, ?, 0, ?, '{}'::jsonb)
                """, productUuid, sellerId, title, DEFAULT_DESCRIPTION, price, stock, categoryId);
        return productUuid;
    }

    @Step("Наполнить каталог: {count} товаров")
    public static List<UUID> insertProductsForPagination(JdbcTemplate jdbc, Long categoryId, int count) {
        List<UUID> ids = new ArrayList<>();
        UUID seller = UUID.randomUUID();
        for (int i = 0; i < count; i++) {
            double price = (i >= 8 && i <= 15) ? 100.00 : 10.00 + i;
            ids.add(insertProduct(jdbc, categoryId, seller, String.format("Товар %02d", i), price, 5L));
        }
        return ids;
    }
}

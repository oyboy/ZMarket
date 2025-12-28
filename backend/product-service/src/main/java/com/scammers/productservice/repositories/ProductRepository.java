package com.scammers.productservice.repositories;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scammers.productservice.components.ProductRowMapper;
import com.scammers.productservice.configs.ObjectMapperFactory;
import com.scammers.productservice.models.Product;
import lombok.RequiredArgsConstructor;
import org.postgresql.util.PGobject;
import org.springframework.dao.support.DataAccessUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.SQLException;
import java.util.*;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class ProductRepository {
    private final JdbcTemplate jdbcTemplate;
    private final ProductRowMapper  productRowMapper;
    private final ObjectMapper objectMapper = ObjectMapperFactory.create();

    public Product save(Product product) {
        if (findByUUID(product.getProductUUID()) == null) {
            String command = "INSERT INTO products (product_uuid, seller_id, title, description, price, stock, category_id, attributes) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

            jdbcTemplate.update(
                    command,
                    product.getProductUUID(),
                    product.getSellerId(),
                    product.getTitle(),
                    product.getDescription(),
                    product.getPrice(),
                    product.getStock(),
                    product.getCategoryId(),
                    mapToJson(product.getAttributes())
            );
        }
        return findByUUID(product.getProductUUID());
    }

    public Product update(Product product) {
        String command = "UPDATE products SET title = ?, description = ?, price = ?, category_id = ?, attributes = ? " +
                "WHERE product_uuid = ?";

        jdbcTemplate.update(
                command,
                product.getTitle(),
                product.getDescription(),
                product.getPrice(),
                product.getCategoryId(),
                mapToJson(product.getAttributes()),
                product.getProductUUID()
        );
        return findByUUID(product.getProductUUID());
    }

    public List<Product> findByOffsetSize(int offset, int size, String orderBy, Long categoryId) {
        String safeOrderBy = validateOrderBy(orderBy);

        StringBuilder sql = new StringBuilder("SELECT * FROM products");
        List<Object> params = new ArrayList<>();

        if (categoryId != null) {
            sql.append(" WHERE category_id = ?");
            params.add(categoryId);
        }

        sql.append(" ORDER BY ").append(safeOrderBy);
        sql.append(" LIMIT ? OFFSET ?");

        params.add(size);
        params.add(offset);

        return jdbcTemplate.query(sql.toString(), productRowMapper, params.toArray());
    }

    private PGobject mapToJson(Map<String, Object> attributes) {
        try {
            PGobject jsonObject = new PGobject();
            jsonObject.setType("jsonb");
            jsonObject.setValue(objectMapper.writeValueAsString(attributes));
            return jsonObject;
        } catch (SQLException | JsonProcessingException e) {
            throw new RuntimeException("Error converting attributes to JSON", e);
        }
    }

    private String validateOrderBy(String orderBy) {
        Set<String> allowedColumns = Set.of("id", "title", "price", "rating", "stock");

        String[] parts = orderBy.split("\\s+", 2);
        String column = parts[0].toLowerCase();
        if (!allowedColumns.contains(column)) {
            return "id";
        }

        String result = column;
        if (parts.length > 1) {
            String direction = parts[1].trim().toUpperCase();
            if ("ASC".equals(direction) || "DESC".equals(direction)) {
                result = column + " " + direction;
            }
        }

        return result;
    }

    public Long getTotalCountOfProducts(Long categoryId) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM products");
        List<Object> params = new ArrayList<>();

        if (categoryId != null) {
            sql.append(" WHERE category_id = ?");
            params.add(categoryId);
        }

        return jdbcTemplate.queryForObject(sql.toString(), Long.class, params.toArray());
    }

    public Product findById(Long id) {
        String command =  "SELECT * FROM products WHERE id = ?";
        List<Product> products = jdbcTemplate.query(command, productRowMapper, id);
        return DataAccessUtils.singleResult(products);
    }

    public Product findByUUID(UUID uuid) {
        String command =  "SELECT * FROM products WHERE product_uuid = ?";
        List<Product> products = jdbcTemplate.query(command, productRowMapper, uuid);
        return DataAccessUtils.singleResult(products);
    }

    public UUID getSellerUUID(UUID productUuid) {
        String command =  "SELECT seller_id FROM products WHERE product_uuid = ?";
        return jdbcTemplate.queryForObject(command, UUID.class, productUuid);
    }

    public List<Product> getProductsForSellerByUUID(UUID sellerUUID) {
        String command = "SELECT * FROM products WHERE seller_id = ?";
        return jdbcTemplate.query(command, productRowMapper, sellerUUID);
    }

    public void updateStock(UUID productUuid, Long newStock) {
        String command = "UPDATE products SET stock = ? WHERE product_uuid = ?";
        jdbcTemplate.update(command, newStock, productUuid);
    }

    public List<Product> findTop6BySellerUUIDAndIdNotOrderByCreatedAtDesc(
            UUID sellerUUID, UUID excludeProductId) {

        String sql = """
        SELECT id, product_uuid, seller_id, title, description, 
               price, stock, category_id, attributes, rating
        FROM products
        WHERE seller_id = ?
          AND product_uuid != ?
        ORDER BY id DESC
        LIMIT 6
        """;

        return jdbcTemplate.query(sql, productRowMapper, sellerUUID, excludeProductId);
    }

    public List<Product> findByUUIDs(List<UUID> uuids) {
        if (uuids == null || uuids.isEmpty()) {
            return List.of();
        }

        String placeholders = uuids.stream()
                .map(u -> "?")
                .collect(Collectors.joining(", "));

        String sql = "SELECT * FROM products WHERE product_uuid IN (" + placeholders + ")";

        return jdbcTemplate.query(sql, productRowMapper, uuids.toArray());
    }
}
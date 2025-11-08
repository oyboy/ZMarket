package com.scammers.productservice.repositories;

import com.scammers.productservice.components.ProductRowMapper;
import com.scammers.productservice.models.Product;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.support.DataAccessUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class ProductRepository {
    private final JdbcTemplate jdbcTemplate;
    private final ProductRowMapper  productRowMapper;
    private static final Logger log = LoggerFactory.getLogger(ProductRepository.class);

    public Product save(Product product) {
        if (findByUUID(product.getProductUUID()) == null) {
            String command = "INSERT INTO products (product_uuid, seller_id, title, description, price, stock, rating) " +
                    "VALUES (?,?,?,?,?,?,?)";
            jdbcTemplate.update(
                    command,
                    product.getProductUUID(),
                    product.getSellerId(),
                    product.getTitle(),
                    product.getDescription(),
                    product.getPrice(),
                    product.getStock(),
                    product.getRating()
            );
        }
        return findByUUID(product.getProductUUID());
    }
    public Product update(Product product) {
        String command = "UPDATE products SET title = ?, description = ?, price = ?, stock = ?" +
                "WHERE product_uuid = ?";
        jdbcTemplate.update(
                command,
                product.getTitle(),
                product.getDescription(),
                product.getPrice(),
                product.getStock()
        );
        return findByUUID(product.getProductUUID());
    }

    public List<Product> findByOffsetSize(int offset, int size, String orderBy) {
        String safeOrderBy = validateOrderBy(orderBy);

        String sql = String.format("SELECT * FROM products ORDER BY %s LIMIT ? OFFSET ?", safeOrderBy);

        return jdbcTemplate.query(sql, productRowMapper, size, offset);
    }

    private String validateOrderBy(String orderBy) {
        Set<String> allowedColumns = Set.of("id", "title", "price", "rating", "stock");

        String[] parts = orderBy.split(" ");
        String column = parts[0].toLowerCase();

        if (!allowedColumns.contains(column)) {
            return "id";
        }

        if (parts.length > 1) {
            String direction = parts[1].toUpperCase();
            if ("ASC".equals(direction) || "DESC".equals(direction)) {
                return column + " " + direction;
            }
        }

        return column;
    }
    public Long getTotalCountOfProducts() {
        String command = "SELECT COUNT(*) FROM products";
        return jdbcTemplate.queryForObject(command, Long.class);
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
}

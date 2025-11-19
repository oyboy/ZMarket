package com.scammers.productservice.components;

import com.scammers.productservice.models.Product;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;

@Component
public class ProductRowMapper implements RowMapper<Product> {
    @Override
    public Product mapRow(ResultSet rs, int rowNum) throws SQLException {
        UUID product_uuid = UUID.fromString((rs.getString("product_uuid").toUpperCase()));
        UUID seller_uuid = UUID.fromString((rs.getString("seller_id").toUpperCase()));

        return new Product(
                rs.getLong("id"),
                product_uuid,
                seller_uuid,
                rs.getString("title"),
                rs.getString("description"),
                rs.getDouble("price"),
                rs.getLong("stock")
        );
    }
}

package com.scammers.productservice.components;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scammers.productservice.models.Product;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProductRowMapper implements RowMapper<Product> {
    private final ObjectMapper objectMapper;

    @Override
    public Product mapRow(ResultSet rs, int rowNum) throws SQLException {
        UUID product_uuid = UUID.fromString((rs.getString("product_uuid")));
        UUID seller_uuid = UUID.fromString((rs.getString("seller_id")));

        Map<String, Object> attributes = new HashMap<>();
        String attributesJson = rs.getString("attributes");
        if (attributesJson != null && !attributesJson.isEmpty()) {
            try {
                attributes = objectMapper.readValue(attributesJson, new TypeReference<Map<String, Object>>() {});
            } catch (JsonProcessingException e) {
                log.error("Error parsing attributes JSON", e);
            }
        }

        return Product.builder()
                .id(rs.getLong("id"))
                .productUUID(product_uuid)
                .sellerId(seller_uuid)
                .title(rs.getString("title"))
                .description(rs.getString("description"))
                .price(rs.getDouble("price"))
                .stock(rs.getLong("stock"))
                .categoryId(rs.getLong("category_id"))
                .attributes(attributes)
                .build();
    }
}

package com.scammers.productservice.support;

import org.junit.jupiter.api.extension.BeforeEachCallback;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import static org.junit.jupiter.api.Assertions.fail;

public class DatabaseCleanerExtension implements BeforeEachCallback {
    private static final String[] TABLES_IN_DELETION_ORDER = {
            "rating_applier_status",
            "outbox",
            "product_reviews",
            "file_attachment",
            "product_details",
            "products",
            "categories"
    };

    @Override
    public void beforeEach(ExtensionContext context) {
        JdbcTemplate jdbc = SpringExtension.getApplicationContext(context)
                .getBean(JdbcTemplate.class);
        try {
            for (String table : TABLES_IN_DELETION_ORDER) {
                jdbc.update("DELETE FROM " + table);
            }
        } catch (Exception e) {
            fail("Не удалось очистить базу перед тестом", e);
        }
    }
}

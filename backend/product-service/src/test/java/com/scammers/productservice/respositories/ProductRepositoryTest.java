package com.scammers.productservice.respositories;

import com.scammers.productservice.components.ProductRowMapper;
import com.scammers.productservice.models.Product;
import com.scammers.productservice.repositories.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.jdbc.DataJdbcTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.jdbc.Sql;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJdbcTest
@Import({ProductRepository.class, ProductRowMapper.class})
@TestPropertySource(properties = {
        "spring.sql.init.mode=always"
})
@ActiveProfiles("test")
@Sql(scripts = "/h2/test-table.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS)
class ProductRepositoryTest {
    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final UUID sellerId = UUID.randomUUID();
    private final UUID productUuid = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("DELETE FROM products");
    }

    @Test
    void save_ShouldInsertNewProduct() {
        Product product = Product.builder()
                .productUUID(productUuid)
                .sellerId(sellerId)
                .title("Test Product")
                .description("Test Description")
                .price(99.99)
                .stock(10L)
                .build();

        Product saved = productRepository.save(product);

        assertThat(saved).isNotNull();
        assertThat(saved.getTitle()).isEqualTo("Test Product");
        assertThat(saved.getPrice()).isEqualTo(99.99);

        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM products", Long.class);
        assertThat(count).isEqualTo(1);
    }

    @Test
    void save_ShouldNotInsertDuplicateProduct() {
        Product product = Product.builder()
                .productUUID(productUuid)
                .sellerId(sellerId)
                .title("Original Title")
                .description("Original Description")
                .price(100.0)
                .stock(5L)
                .build();

        productRepository.save(product);

        Product duplicate = Product.builder()
                .productUUID(productUuid)
                .sellerId(sellerId)
                .title("New Title")
                .description("New Description")
                .price(200.0)
                .stock(10L)
                .build();

        Product result = productRepository.save(duplicate);

        assertThat(result.getTitle()).isEqualTo("Original Title");
        assertThat(result.getPrice()).isEqualTo(100.0);

        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM products", Long.class);
        assertThat(count).isEqualTo(1);
    }

    @Test
    void update_ShouldModifyExistingProduct() {
        Product original = Product.builder()
                .productUUID(productUuid)
                .sellerId(sellerId)
                .title("Original Title")
                .description("Original Description")
                .price(100.0)
                .stock(5L)
                .build();

        productRepository.save(original);

        Product toUpdate = Product.builder()
                .productUUID(productUuid)
                .sellerId(sellerId)
                .title("Updated Title")
                .description("Updated Description")
                .price(150.0)
                .stock(8L)
                .build();

        Product updated = productRepository.update(toUpdate);

        assertThat(updated.getTitle()).isEqualTo("Updated Title");
        assertThat(updated.getDescription()).isEqualTo("Updated Description");
        assertThat(updated.getPrice()).isEqualTo(150.0);
        assertThat(updated.getStock()).isEqualTo(8);
    }

    @Test
    void findByUUID_ShouldReturnProduct() {
        Product product = Product.builder()
                .productUUID(productUuid)
                .sellerId(sellerId)
                .title("Test Product")
                .description("Test Description")
                .price(99.99)
                .stock(10L)
                .build();

        productRepository.save(product);

        Product found = productRepository.findByUUID(productUuid);

        assertThat(found).isNotNull();
        assertThat(found.getProductUUID()).isEqualTo(productUuid);
        assertThat(found.getTitle()).isEqualTo("Test Product");
    }

    @Test
    void findByUUID_ShouldReturnNullForNonExistentProduct() {
        Product found = productRepository.findByUUID(UUID.randomUUID());
        assertThat(found).isNull();
    }

    @Test
    void findById_ShouldReturnProduct() {
        Product product = Product.builder()
                .productUUID(productUuid)
                .sellerId(sellerId)
                .title("Test Product")
                .description("Test Description")
                .price(99.99)
                .stock(10L)
                .build();

        Product saved = productRepository.save(product);
        Long generatedId = saved.getId();

        Product found = productRepository.findById(generatedId);

        assertThat(found).isNotNull();
        assertThat(found.getId()).isEqualTo(generatedId);
        assertThat(found.getTitle()).isEqualTo("Test Product");
    }

    @Test
    void findByOffsetSize_ShouldReturnPaginatedResults() {
        for (long i = 1; i <= 5; i++) {
            Product product = Product.builder()
                    .productUUID(UUID.randomUUID())
                    .sellerId(sellerId)
                    .title("Product " + i)
                    .description("Description " + i)
                    .price(10.0 * i)
                    .stock(i)
                    .build();
            productRepository.save(product);
        }

        List<Product> page1 = productRepository.findByOffsetSize(0, 2, "price");
        List<Product> page2 = productRepository.findByOffsetSize(2, 2, "price");

        assertThat(page1).hasSize(2);
        assertThat(page2).hasSize(2);
        assertThat(page1.get(0).getPrice()).isLessThan(page1.get(1).getPrice());
    }

    @Test
    void findByOffsetSize_ShouldValidateOrderBy() {
        Product product1 = Product.builder()
                .productUUID(UUID.randomUUID())
                .sellerId(sellerId)
                .title("B Product")
                .price(50.0)
                .stock(5L)
                .build();

        Product product2 = Product.builder()
                .productUUID(UUID.randomUUID())
                .sellerId(sellerId)
                .title("A Product")
                .price(100.0)
                .stock(10L)
                .build();

        productRepository.save(product1);
        productRepository.save(product2);

        List<Product> result = productRepository.findByOffsetSize(0, 10, "invalid_column DESC");

        assertThat(result).hasSize(2);
    }

    @Test
    void getTotalCountOfProducts_ShouldReturnCorrectCount() {
        for (long i = 0; i < 3; i++) {
            Product product = Product.builder()
                    .productUUID(UUID.randomUUID())
                    .sellerId(sellerId)
                    .title("Product " + i)
                    .price(10.0 * i)
                    .stock(i)
                    .build();
            productRepository.save(product);
        }

        Long count = productRepository.getTotalCountOfProducts();

        assertThat(count).isEqualTo(3);
    }

    @Test
    void getSellerUUID_ShouldReturnSellerId() {
        Product product = Product.builder()
                .productUUID(productUuid)
                .sellerId(sellerId)
                .title("Test Product")
                .price(99.99)
                .stock(10L)
                .build();

        productRepository.save(product);

        UUID foundSellerId = productRepository.getSellerUUID(productUuid);

        assertThat(foundSellerId).isEqualTo(sellerId);
    }

    @Test
    void validateOrderBy_ShouldHandleDifferentInputs() throws Exception {
        ProductRepository repository = new ProductRepository(jdbcTemplate, new ProductRowMapper());

        var validateMethod = ProductRepository.class.getDeclaredMethod("validateOrderBy", String.class);
        validateMethod.setAccessible(true);

        assertThat(validateMethod.invoke(repository, "title")).isEqualTo("title");
        assertThat(validateMethod.invoke(repository, "price DESC")).isEqualTo("price DESC");
        assertThat(validateMethod.invoke(repository, "rating ASC")).isEqualTo("rating ASC");
        assertThat(validateMethod.invoke(repository, "invalid_column")).isEqualTo("id");
        assertThat(validateMethod.invoke(repository, "title INVALID_DIRECTION")).isEqualTo("title");
    }
}
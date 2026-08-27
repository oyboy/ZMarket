package com.scammers.productservice.integration;

import com.scammers.productservice.data.ProductTestData;
import com.scammers.productservice.models.Product;
import com.scammers.productservice.repositories.ProductRepository;
import com.scammers.productservice.support.AbstractIntegrationTest;
import io.qameta.allure.Description;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import io.qameta.allure.TmsLink;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@Epic("Сервис товаров")
@Feature("Слой доступа к данным")
@DisplayName("ProductRepository на PostgreSQL")
class ProductRepositoryIT extends AbstractIntegrationTest {
    @Autowired
    private ProductRepository repository;

    private Long categoryId;

    @BeforeEach
    void createCategory() {
        categoryId = ProductTestData.insertCategory(jdbc, "Электроника");
    }

    @Test
    @DisplayName("Сохраняет товар и возвращает его с идентификатором из базы")
    @Story("Сохранение товара")
    @Severity(SeverityLevel.CRITICAL)
    @TmsLink("TC_REPO_01")
    void savesProduct() {
        Product product = ProductTestData.product().categoryId(categoryId).build();

        Product saved = repository.save(product);

        assertThat(saved).isNotNull();
        assertThat(saved.getId())
                .as("идентификатор должен прийти из базы, а не из объекта")
                .isNotNull()
                .isPositive();
        assertThat(saved.getCategoryId()).isEqualTo(categoryId);
    }

    @Test
    @DisplayName("Сохраняет и читает обратно произвольные атрибуты в jsonb")
    @Description("Именно этот сценарий невозможно проверить на H2 — там нет типа jsonb")
    @Story("Сохранение товара")
    @Severity(SeverityLevel.CRITICAL)
    @TmsLink("TC_REPO_02")
    void savesJsonbAttributes() {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("цвет", "чёрный");
        attributes.put("вес", 1.5);
        attributes.put("гарантия", true);

        Product saved = repository.save(ProductTestData.product()
                .categoryId(categoryId)
                .attributes(attributes)
                .build());

        Product loaded = repository.findByUUID(saved.getProductUUID());

        assertThat(loaded.getAttributes())
                .containsEntry("цвет", "чёрный")
                .containsEntry("вес", 1.5)
                .containsEntry("гарантия", true);
    }

    @Test
    @DisplayName("Повторное сохранение того же идентификатора не создаёт дубль")
    @Description("В запросе стоит ON CONFLICT DO NOTHING: вставка идемпотентна")
    @Story("Сохранение товара")
    @TmsLink("TC_REPO_03")
    void saveIsIdempotentByUuid() {
        UUID uuid = UUID.randomUUID();
        repository.save(ProductTestData.product()
                .productUUID(uuid).categoryId(categoryId).title("Первое название").build());

        Product result = repository.save(ProductTestData.product()
                .productUUID(uuid).categoryId(categoryId).title("Второе название").build());

        assertThat(result.getTitle())
                .as("первая запись не должна перетираться второй")
                .isEqualTo("Первое название");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM products", Long.class)).isEqualTo(1L);
    }

    @Test
    @DisplayName("Поиск несуществующего товара возвращает null, а не исключение")
    @Story("Чтение товара")
    @TmsLink("TC_REPO_04")
    void findByUuidReturnsNullForUnknown() {
        assertThat(repository.findByUUID(UUID.randomUUID())).isNull();
    }

    @Test
    @DisplayName("Обновление меняет поля, но не трогает остаток на складе")
    @Description("Остатком владеет warehouse-service; через карточку товара он меняться не должен")
    @Story("Обновление товара")
    @Severity(SeverityLevel.CRITICAL)
    @TmsLink("TC_REPO_05")
    void updateDoesNotTouchStock() {
        Product saved = repository.save(ProductTestData.product()
                .categoryId(categoryId).stock(5L).build());

        Product updated = repository.update(ProductTestData.product()
                .productUUID(saved.getProductUUID())
                .sellerId(saved.getSellerId())
                .categoryId(categoryId)
                .title("Новое название")
                .price(150.0)
                .stock(999L)
                .build());

        assertThat(updated.getTitle()).isEqualTo("Новое название");
        assertThat(updated.getPrice()).isEqualTo(150.0);
        assertThat(updated.getStock())
                .as("остаток должен остаться прежним, несмотря на 999 в запросе")
                .isEqualTo(5L);
    }

    @Test
    @DisplayName("Поиск по списку идентификаторов не идёт в базу на пустом списке")
    @Description("Пустой IN () — синтаксическая ошибка в SQL; метод обязан отсечь этот случай раньше")
    @Story("Чтение товара")
    @TmsLink("TC_REPO_06")
    void findByUuidsHandlesEmptyInput() {
        assertThat(repository.findByUUIDs(List.of())).isEmpty();
        assertThat(repository.findByUUIDs(null)).isEmpty();
    }

    @Test
    @DisplayName("Поиск по списку возвращает только запрошенные товары")
    @Story("Чтение товара")
    @TmsLink("TC_REPO_07")
    void findByUuidsReturnsRequestedOnly() {
        UUID first = ProductTestData.insertProduct(jdbc, categoryId, "Первый", 10.0);
        UUID second = ProductTestData.insertProduct(jdbc, categoryId, "Второй", 20.0);
        ProductTestData.insertProduct(jdbc, categoryId, "Третий", 30.0);

        List<Product> found = repository.findByUUIDs(List.of(first, second));

        assertThat(found)
                .hasSize(2)
                .extracting(Product::getProductUUID)
                .containsExactlyInAnyOrder(first, second);
    }

    @ParameterizedTest(name = "фильтр по категории = {0}, ожидается {1} товаров")
    @CsvSource({"true, 3", "false, 5"})
    @DisplayName("Подсчёт учитывает фильтр по категории")
    @Story("Подсчёт товаров")
    @Severity(SeverityLevel.CRITICAL)
    @TmsLink("TC_REPO_08")
    void countRespectsCategoryFilter(boolean filtered, long expected) {
        Long otherCategory = ProductTestData.insertCategory(jdbc, "Одежда");
        for (int i = 0; i < 3; i++) {
            ProductTestData.insertProduct(jdbc, categoryId, "Электроника " + i, 10.0);
        }
        for (int i = 0; i < 2; i++) {
            ProductTestData.insertProduct(jdbc, otherCategory, "Одежда " + i, 20.0);
        }

        Long count = repository.getTotalCountOfProducts(filtered ? categoryId : null);

        assertThat(count).isEqualTo(expected);
    }

    @Test
    @DisplayName("Товары продавца возвращаются только его собственные")
    @Story("Товары продавца")
    @Severity(SeverityLevel.BLOCKER)
    @TmsLink("TC_REPO_09")
    void productsForSellerAreIsolated() {
        UUID seller = UUID.randomUUID();
        UUID otherSeller = UUID.randomUUID();
        ProductTestData.insertProduct(jdbc, categoryId, seller, "Мой 1", 10.0, 1L);
        ProductTestData.insertProduct(jdbc, categoryId, seller, "Мой 2", 20.0, 1L);
        ProductTestData.insertProduct(jdbc, categoryId, otherSeller, "Чужой", 30.0, 1L);

        List<Product> mine = repository.getProductsForSellerByUUID(seller);

        assertThat(mine)
                .hasSize(2)
                .allSatisfy(product -> assertThat(product.getSellerId()).isEqualTo(seller));
    }

    @Test
    @DisplayName("Рекомендации продавца исключают текущий товар и отдают не больше шести")
    @Description("Проверяются обе границы сразу: и предел выдачи, и исключение текущего товара")
    @Story("Рекомендации")
    @TmsLink("TC_REPO_10")
    void recommendationsExcludeCurrentAndLimitToSix() {
        UUID seller = UUID.randomUUID();
        UUID current = ProductTestData.insertProduct(jdbc, categoryId, seller, "Текущий", 10.0, 1L);
        for (int i = 0; i < 10; i++) {
            ProductTestData.insertProduct(jdbc, categoryId, seller, "Другой " + i, 10.0, 1L);
        }

        List<Product> recommendations =
                repository.findTop6BySellerUUIDAndIdNotOrderByCreatedAtDesc(seller, current);

        assertThat(recommendations).hasSize(6);
        assertThat(recommendations)
                .extracting(Product::getProductUUID)
                .doesNotContain(current);
    }
}
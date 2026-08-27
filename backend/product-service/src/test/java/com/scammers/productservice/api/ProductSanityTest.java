package com.scammers.productservice.api;

import com.scammers.productservice.data.ProductTestData;
import com.scammers.productservice.models.requests.ProductCreateRequest;
import io.qameta.allure.Description;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Step;
import io.qameta.allure.Story;
import io.qameta.allure.TmsLink;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;

@Epic("Сервис товаров")
@Feature("Жизненный цикл товара")
@DisplayName("Санити: работа с товаром от создания до обновления")
class ProductSanityTest extends BaseApiTest {

    private Long categoryId;

    @BeforeEach
    void createCategory() {
        categoryId = ProductTestData.insertCategory(jdbc, "Электроника");
    }

    @Test
    @DisplayName("Товар создаётся, читается, находится в списках и обновляется")
    @Description("Основной путь продавца целиком: если он проходит, базовая функциональность цела")
    @Story("Основной сценарий продавца")
    @Severity(SeverityLevel.BLOCKER)
    @TmsLink("TC_SANITY_01")
    void fullProductLifecycle() {
        ProductCreateRequest request = ProductTestData.createRequest(
                "Смартфон", 30000.0, categoryId, Map.of("цвет", "чёрный", "память", "256"));

        UUID productUuid = createProduct(request);
        readProductBack(productUuid, "Смартфон", 30000.0f);
        checkVisibleInCatalog(productUuid);
        checkVisibleInSellerList(productUuid);
        updateProduct(productUuid);
        checkUpdateApplied(productUuid);
    }

    @Step("Создать товар и получить идентификатор")
    private UUID createProduct(ProductCreateRequest request) {
        UUID uuid = asSeller.createProductAndGetUuid(request);
        assertThat(uuid).isNotNull();
        return uuid;
    }

    @Step("Прочитать товар по идентификатору")
    private void readProductBack(UUID uuid, String expectedTitle, float expectedPrice) {
        asSeller.getProduct(uuid)
                .then()
                .statusCode(200)
                .body("title", equalTo(expectedTitle))
                .body("price", equalTo(expectedPrice))
                .body("attributes.цвет", equalTo("чёрный"))
                .body("sellerId", equalTo(sellerId.toString()));
    }

    @Step("Убедиться, что товар виден в общем каталоге")
    private void checkVisibleInCatalog(UUID uuid) {
        List<String> uuidsInCatalog = anonymous.getProducts(0, 20, null, categoryId)
                .then().statusCode(200)
                .extract().jsonPath().getList("productUUID", String.class);

        assertThat(uuidsInCatalog)
                .as("созданный товар должен появиться в каталоге своей категории")
                .contains(uuid.toString());
    }

    @Step("Убедиться, что товар виден в списке продавца")
    private void checkVisibleInSellerList(UUID uuid) {
        asSeller.getMyProducts()
                .then()
                .statusCode(200)
                .body("productUUID", hasItem(uuid.toString()));
    }

    @Step("Обновить товар")
    private void updateProduct(UUID uuid) {
        asSeller.updateProduct(uuid, ProductTestData.createRequest(
                        "Смартфон (обновлён)", "Ещё лучше", 27000.0, 0L, categoryId))
                .then()
                .statusCode(200)
                .body("title", equalTo("Смартфон (обновлён)"));
    }


    @Step("Проверить, что обновление действительно сохранилось")
    private void checkUpdateApplied(UUID uuid) {
        asSeller.getProduct(uuid)
                .then()
                .statusCode(200)
                .body("title", equalTo("Смартфон (обновлён)"))
                .body("price", equalTo(27000.0f));

        String titleInDb = jdbc.queryForObject(
                "SELECT title FROM products WHERE product_uuid = ?", String.class, uuid);
        assertThat(titleInDb)
                .as("в базе должно лежать новое название, а не старое")
                .isEqualTo("Смартфон (обновлён)");
    }

    @Test
    @DisplayName("После обновления читается новое значение, а не устаревший кеш")
    @Description("Проверяет согласованность @Cacheable на чтении и @CachePut на обновлении")
    @Story("Кеширование карточки товара")
    @Severity(SeverityLevel.CRITICAL)
    @TmsLink("TC_SANITY_02")
    void cacheIsInvalidatedOnUpdate() {
        UUID productUuid = ProductTestData.insertProduct(
                jdbc, categoryId, sellerId, "Первое название", 100.0, 1L);

        asSeller.getProduct(productUuid)
                .then().statusCode(200).body("title", equalTo("Первое название"));

        asSeller.updateProduct(productUuid, ProductTestData.createRequest(
                        "Второе название", "Описание", 100.0, 0L, categoryId))
                .then().statusCode(200);

        asSeller.getProduct(productUuid)
                .then()
                .statusCode(200)
                .body("title", equalTo("Второе название"));
    }
}
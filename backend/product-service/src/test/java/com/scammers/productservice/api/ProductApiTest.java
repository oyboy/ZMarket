package com.scammers.productservice.api;

import com.scammers.productservice.data.ExpectedProduct;
import com.scammers.productservice.data.ProductTestData;
import com.scammers.productservice.models.requests.ProductCreateRequest;
import io.qameta.allure.Description;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import io.qameta.allure.TmsLink;
import io.restassured.response.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static net.javacrumbs.jsonunit.assertj.JsonAssertions.assertThatJson;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasSize;

@Epic("Сервис товаров")
@Feature("HTTP-ручки каталога")
@DisplayName("API товаров")
class ProductApiTest extends BaseApiTest {

    private Long categoryId;

    @BeforeEach
    void createCategory() {
        categoryId = ProductTestData.insertCategory(jdbc, "Электроника");
    }

    @Nested
    @DisplayName("Чтение карточки товара")
    class GetOne {

        @Test
        @DisplayName("Возвращается полный объект товара")
        @Description("Ответ сравнивается целиком, а не по паре полей: так замечается и пропажа поля, и появление лишнего")
        @Story("Чтение товара")
        @Severity(SeverityLevel.CRITICAL)
        @TmsLink("TC_API_01")
        void returnsCompleteProduct() {
            ProductCreateRequest request = ProductTestData.createRequest(
                    "Ноутбук", 55000.0, categoryId, Map.of("экран", "15"));
            UUID productUuid = asSeller.createProductAndGetUuid(request);

            String actualJson = asSeller.getProduct(productUuid)
                    .then().statusCode(200)
                    .extract().asString();

            assertThatJson(actualJson)
                    .whenIgnoringPaths(ExpectedProduct.unpredictablePaths())
                    .isEqualTo(ExpectedProduct.afterCreate(request, sellerId));
        }

        @Test
        @DisplayName("Несуществующий товар — 404")
        @Description("Не 500 и не 200 с пустым телом: клиент должен уметь отличить отсутствие товара от сбоя")
        @Story("Чтение товара")
        @TmsLink("TC_API_02")
        void returns404ForUnknownProduct() {
            anonymous.getProduct(UUID.randomUUID())
                    .then().statusCode(404);
        }

        @ParameterizedTest(name = "идентификатор \"{0}\" даёт 4xx")
        @ValueSource(strings = {"not-a-uuid", "12345", "'", "null"})
        @DisplayName("Некорректный формат идентификатора не даёт 500")
        @Description("Ошибка клиента должна оставаться ошибкой клиента, а не превращаться в сбой сервера")
        @Story("Чтение товара")
        @TmsLink("TC_API_03")
        void malformedUuidGives4xx(String rawUuid) {
            int status = anonymous.getProductByRawId(rawUuid).statusCode();

            assertThat(status)
                    .as("для кривого идентификатора ожидается 4xx, а пришло %d", status)
                    .isBetween(400, 499);
        }

        @Test
        @DisplayName("Чтение доступно без токена")
        @Story("Права доступа на чтение")
        @TmsLink("TC_API_04")
        void readableWithoutAuth() {
            UUID productUuid = ProductTestData.insertProduct(jdbc, categoryId, "Товар", 100.0);

            anonymous.getProduct(productUuid).then().statusCode(200);
        }
    }

    @Nested
    @DisplayName("Список товаров")
    class GetList {

        @Test
        @DisplayName("Отдаётся запрошенное количество товаров")
        @Story("Чтение каталога")
        @TmsLink("TC_API_05")
        void respectsRequestedSize() {
            ProductTestData.insertProductsForPagination(jdbc, categoryId, 25);

            anonymous.getProducts(0, 10)
                    .then().statusCode(200)
                    .body("$", hasSize(10));
        }

        @Test
        @DisplayName("Соседние страницы не пересекаются")
        @Description("Проверка стыка страниц: именно здесь живут дефекты пагинации, а не внутри одной страницы")
        @Story("Чтение каталога")
        @Severity(SeverityLevel.CRITICAL)
        @TmsLink("TC_API_06")
        void pagesDoNotOverlap() {
            ProductTestData.insertProductsForPagination(jdbc, categoryId, 25);

            List<String> firstPage = uuidsOnPage(0);
            List<String> secondPage = uuidsOnPage(1);

            assertThat(secondPage)
                    .as("вторая страница не должна повторять товары с первой")
                    .doesNotContainAnyElementsOf(firstPage);
        }

        private List<String> uuidsOnPage(int page) {
            return anonymous.getProducts(page, 10)
                    .then().statusCode(200)
                    .extract().jsonPath().getList("productUUID", String.class);
        }

        @ParameterizedTest(name = "{0}: запрошено page={1}, size={2}")
        @MethodSource("com.scammers.productservice.data.ProductDataProviders#pagingBoundaries")
        @DisplayName("Границы страницы нормализуются на стороне сервера")
        @Description("Клиент может прислать что угодно; сервер обязан привести значения к допустимым, а не упасть")
        @Story("Чтение каталога")
        @TmsLink("TC_API_07")
        void pagingBoundariesAreNormalized(String caseName, int page, int size,
                                           int expectedPage, int expectedSize) {
            ProductTestData.insertProductsForPagination(jdbc, categoryId, 120);

            List<?> items = anonymous.getProducts(page, size)
                    .then().statusCode(200)
                    .extract().jsonPath().getList("$");

            assertThat(items.size())
                    .as("%s: сервер должен был вернуть не больше %d записей", caseName, expectedSize)
                    .isLessThanOrEqualTo(expectedSize);
        }

        @ParameterizedTest(name = "сортировка \"{0}\" ({1})")
        @MethodSource("com.scammers.productservice.data.ProductDataProviders#orderParameters")
        @DisplayName("Любое значение сортировки не роняет ручку и не выполняет чужой SQL")
        @Description("Имя колонки нельзя передать плейсхолдером, поэтому оно подклеивается в текст запроса — "
                + "это единственное место, где возможна подстановка SQL")
        @Story("Сортировка каталога")
        @Severity(SeverityLevel.CRITICAL)
        @TmsLink("TC_API_08")
        void orderParameterIsSafe(String order, String caseDescription) {
            ProductTestData.insertProductsForPagination(jdbc, categoryId, 5);

            anonymous.getProducts(0, 20, order, null)
                    .then().statusCode(200)
                    .body("$", hasSize(5));

            assertThat(jdbc.queryForObject("SELECT count(*) FROM products", Long.class))
                    .as("%s: таблица должна остаться на месте", caseDescription)
                    .isEqualTo(5L);
        }

        @Test
        @DisplayName("Фильтр по категории отдаёт только её товары")
        @Story("Фильтрация каталога")
        @TmsLink("TC_API_09")
        void filtersByCategory() {
            Long otherCategory = ProductTestData.insertCategory(jdbc, "Одежда");
            ProductTestData.insertProductsForPagination(jdbc, categoryId, 5);
            ProductTestData.insertProductsForPagination(jdbc, otherCategory, 3);

            anonymous.getProducts(0, 20, null, otherCategory)
                    .then().statusCode(200)
                    .body("$", hasSize(3))
                    .body("categoryId", everyItem(equalTo(otherCategory.intValue())));
        }

        @Test
        @DisplayName("Ответ должен содержать метаданные страницы")
        @Description("Дефект: без totalElements и totalPages клиент не может построить навигацию по каталогу")
        @Story("Чтение каталога")
        @Severity(SeverityLevel.CRITICAL)
        @TmsLink("TC_API_10")
        void responseShouldContainPaginationMetadata() {
            ProductTestData.insertProductsForPagination(jdbc, categoryId, 25);

            anonymous.getProducts(0, 10)
                    .then().statusCode(200)
                    .body("totalElements", equalTo(25))
                    .body("totalPages", equalTo(3))
                    .body("content", hasSize(10));
        }
    }

    @Nested
    @DisplayName("Создание товара")
    class CreateProduct {
        @Test
        @DisplayName("Продавец создаёт товар")
        @Description("Проверяется и ответ ручки, и появление записи в базе — ответ мог прийти из памяти")
        @Story("Создание товара")
        @Severity(SeverityLevel.BLOCKER)
        @TmsLink("TC_API_11")
        void sellerCreatesProduct() {
            ProductCreateRequest request = ProductTestData.createRequest(
                    "Новый товар", 1500.0, categoryId, Map.of("цвет", "синий"));

            String responseJson = asSeller.createProduct(request)
                    .then().statusCode(200)
                    .extract().asString();

            assertThatJson(responseJson)
                    .whenIgnoringPaths(ExpectedProduct.unpredictablePaths())
                    .isEqualTo(ExpectedProduct.afterCreate(request, sellerId));

            Long count = jdbc.queryForObject(
                    "SELECT count(*) FROM products WHERE title = ?", Long.class, "Новый товар");
            assertThat(count)
                    .as("товар должен реально появиться в базе, а не только в ответе")
                    .isEqualTo(1L);
        }

        @Test
        @DisplayName("Без токена — 401")
        @Story("Права доступа на создание")
        @Severity(SeverityLevel.CRITICAL)
        @TmsLink("TC_API_12")
        void anonymousGets401() {
            anonymous.createProduct(ProductTestData.createRequest(categoryId))
                    .then().statusCode(401);
        }

        @Test
        @DisplayName("Покупатель без роли продавца — 403")
        @Description("Разница между 401 и 403 существенна: первое — не представился, второе — представился, но не имеет права")
        @Story("Права доступа на создание")
        @Severity(SeverityLevel.CRITICAL)
        @TmsLink("TC_API_13")
        void buyerGets403() {
            asBuyer.createProduct(ProductTestData.createRequest(categoryId))
                    .then().statusCode(403);

            assertThat(jdbc.queryForObject("SELECT count(*) FROM products", Long.class))
                    .as("при отказе в доступе не должно появиться никаких записей")
                    .isZero();
        }

        @ParameterizedTest(name = "{0}")
        @MethodSource("com.scammers.productservice.data.ProductDataProviders#invalidProducts")
        @DisplayName("Некорректные данные дают 4xx")
        @Story("Проверка входных данных")
        @Severity(SeverityLevel.NORMAL)
        @TmsLink("TC_API_14")
        void invalidProductGives4xx(String caseName, ProductCreateRequest request) {
            ProductCreateRequest withRealCategory = new ProductCreateRequest(
                    request.title(), request.description(), request.price(),
                    request.stock(), categoryId, request.attributes());

            int status = asSeller.createProduct(withRealCategory).statusCode();

            assertThat(status)
                    .as("%s: ожидался код 4xx, а пришёл %d", caseName, status)
                    .isBetween(400, 499);
        }

        @ParameterizedTest(name = "{0}")
        @MethodSource("com.scammers.productservice.data.ProductDataProviders#incompleteRequestBodies")
        @DisplayName("Пропущенное поле создаёт 400 код")
        @Description("Дефект: отсутствие проверки на null в validateProductParams превращает ошибку клиента в сбой сервера")
        @Story("Проверка входных данных")
        @Severity(SeverityLevel.NORMAL)
        @TmsLink("TC_API_15")
        void missingFieldGives400(String caseName, Map<String, Object> body) {
            int status = asSeller.createProductRaw(body).statusCode();

            assertThat(status)
                    .as("%s: ожидался код 4xx, а пришёл %d", caseName, status)
                    .isBetween(400, 499);
        }

        @Test
        @DisplayName("Несуществующая категория не даёт создать товар")
        @Story("Проверка входных данных")
        @TmsLink("TC_API_16")
        void unknownCategoryRejected() {
            Response response = asSeller.createProduct(
                    ProductTestData.createRequest("Товар", "Описание", 10.0, 0L, 999_999L));

            assertThat(response.statusCode()).isBetween(400, 499);
            assertThat(jdbc.queryForObject("SELECT count(*) FROM products", Long.class)).isZero();
        }
    }

    @Nested
    @DisplayName("Обновление товара")
    class UpdateProduct {

        @Test
        @DisplayName("Владелец обновляет свой товар")
        @Story("Права доступа на изменение")
        @Severity(SeverityLevel.CRITICAL)
        @TmsLink("TC_API_17")
        void ownerUpdatesOwnProduct() {
            UUID productUuid = ProductTestData.insertProduct(
                    jdbc, categoryId, sellerId, "Старое название", 100.0, 5L);

            asSeller.updateProduct(productUuid, ProductTestData.createRequest(
                            "Новое название", "Новое описание", 200.0, 0L, categoryId))
                    .then()
                    .statusCode(200)
                    .body("title", equalTo("Новое название"))
                    .body("price", equalTo(200.0f));
        }

        @Test
        @DisplayName("Чужой продавец не может обновить товар")
        @Description("Проверяется не только код ответа, но и то, что данные в базе не изменились")
        @Story("Права доступа на изменение")
        @Severity(SeverityLevel.BLOCKER)
        @TmsLink("TC_API_18")
        void strangerCannotUpdate() {
            UUID productUuid = ProductTestData.insertProduct(
                    jdbc, categoryId, sellerId, "Исходное название", 100.0, 5L);

            asOtherSeller.updateProduct(productUuid, ProductTestData.createRequest(
                            "Взломано", "Описание", 1.0, 0L, categoryId))
                    .then().statusCode(403);

            String titleInDb = jdbc.queryForObject(
                    "SELECT title FROM products WHERE product_uuid = ?", String.class, productUuid);
            assertThat(titleInDb)
                    .as("отказ в доступе не должен оставлять следов в данных")
                    .isEqualTo("Исходное название");
        }
    }

    @Nested
    @DisplayName("Товары продавца")
    class MyProducts {
        @Test
        @DisplayName("Продавец видит только свои товары")
        @Description("Утечка чужих товаров в личный список — дефект безопасности, а не косметика")
        @Story("Личный список продавца")
        @Severity(SeverityLevel.BLOCKER)
        @TmsLink("TC_API_19")
        void sellerSeesOwnProductsOnly() {
            ProductTestData.insertProduct(jdbc, categoryId, sellerId, "Мой 1", 10.0, 1L);
            ProductTestData.insertProduct(jdbc, categoryId, sellerId, "Мой 2", 20.0, 1L);
            ProductTestData.insertProduct(jdbc, categoryId, otherSellerId, "Чужой", 30.0, 1L);

            asSeller.getMyProducts()
                    .then()
                    .statusCode(200)
                    .body("$", hasSize(2))
                    .body("sellerId", everyItem(equalTo(sellerId.toString())));
        }

        @Test
        @DisplayName("Покупателю ручка недоступна")
        @Story("Личный список продавца")
        @TmsLink("TC_API_20")
        void buyerForbidden() {
            asBuyer.getMyProducts().then().statusCode(403);
        }
    }
}
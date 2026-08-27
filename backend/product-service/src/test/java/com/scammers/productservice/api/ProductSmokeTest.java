package com.scammers.productservice.api;

import io.qameta.allure.Description;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import io.qameta.allure.TmsLink;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.lessThan;


@Epic("Сервис товаров")
@Feature("Работоспособность сервиса")
@DisplayName("Смоук сервиса товаров")
class ProductSmokeTest extends BaseApiTest {

    @Test
    @DisplayName("База доступна и миграции накатились")
    @Description("Проверяет, что Flyway создал все таблицы и колонки, которые ожидает код")
    @Story("Доступность базы данных")
    @Severity(SeverityLevel.BLOCKER)
    @TmsLink("TC_SMOKE_01")
    void databaseIsMigrated() {
        assertThat(jdbc.queryForObject("SELECT 1", Integer.class)).isEqualTo(1);
    }

    @ParameterizedTest(name = "таблица {0} создана")
    @ValueSource(strings = {"products", "product_reviews", "outbox",
            "rating_applier_status", "product_details", "file_attachment", "categories"})
    @DisplayName("Все таблицы из миграций существуют")
    @Story("Доступность базы данных")
    @Severity(SeverityLevel.BLOCKER)
    @TmsLink("TC_SMOKE_02")
    void allTablesExist(String table) {
        Boolean exists = jdbc.queryForObject("""
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = ?
                )
                """, Boolean.class, table);

        assertThat(exists)
                .as("таблица %s не создана миграциями", table)
                .isTrue();
    }

    @ParameterizedTest(name = "колонка products.{0} существует")
    @ValueSource(strings = {"category_id", "attributes", "product_uuid", "seller_id", "rating"})
    @DisplayName("Колонки products соответствуют коду")
    @Story("Доступность базы данных")
    @TmsLink("TC_SMOKE_03")
    void productColumnsExist(String column) {
        Boolean exists = jdbc.queryForObject("""
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'products' AND column_name = ?
                )
                """, Boolean.class, column);

        assertThat(exists)
                .as("колонка products.%s отсутствует, а ProductRowMapper её читает", column)
                .isTrue();
    }

    @Test
    @DisplayName("Список товаров отвечает и укладывается в секунду")
    @Description("Главная ручка каталога отвечает 200 и не тормозит")
    @Story("Доступность ручек")
    @Severity(SeverityLevel.CRITICAL)
    @TmsLink("TC_SMOKE_04")
    void productListResponds() {
        anonymous.getProducts(0, 20)
                .then()
                .statusCode(200)
                .time(lessThan(1000L));
    }

    @Test
    @DisplayName("Список категорий отвечает")
    @Story("Доступность ручек")
    @TmsLink("TC_SMOKE_05")
    void categoryListResponds() {
        anonymous.getCategories().then().statusCode(200);
    }

    @Test
    @DisplayName("Закрытая ручка требует токен, а не падает")
    @Description("Отсутствие токена должно давать 401")
    @Story("Доступность ручек")
    @Severity(SeverityLevel.CRITICAL)
    @TmsLink("TC_SMOKE_06")
    void protectedEndpointRequiresAuth() {
        anonymous.getMyProducts().then().statusCode(401);
    }

    @Test
    @DisplayName("Проверка здоровья отвечает UP")
    @Description("Одна ручка отвечает за состояние всех подключений сразу — самый естественный смоук")
    @Story("Доступность ручек")
    @Severity(SeverityLevel.BLOCKER)
    @TmsLink("TC_SMOKE_07")
    void healthIsUp() {
        io.restassured.RestAssured.given()
                .when().get("/actuator/health")
                .then()
                .statusCode(200)
                .body("status", equalTo("UP"));
    }
}

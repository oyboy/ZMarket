package com.scammers.productservice.api.clients;

import com.scammers.productservice.models.requests.ProductCreateRequest;
import io.qameta.allure.Step;
import io.restassured.RestAssured;
import io.restassured.builder.RequestSpecBuilder;
import io.restassured.filter.log.LogDetail;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;

import java.util.UUID;

public class ProductClient {

    private final RequestSpecification spec;

    private ProductClient(String bearerToken) {
        RequestSpecBuilder builder = new RequestSpecBuilder()
                .setBasePath("/api/v1")
                .setContentType(ContentType.JSON);
        if (bearerToken != null) {
            builder.addHeader("Authorization", "Bearer " + bearerToken);
        }
        this.spec = builder.build();
    }

    public static void configure(int port) {
        RestAssured.port = port;
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails(LogDetail.ALL);
    }

    public static ProductClient anonymous() {
        return new ProductClient(null);
    }

    public static ProductClient withToken(String token) {
        return new ProductClient(token);
    }

    @Step("Получить товар {productUuid}")
    public Response getProduct(UUID productUuid) {
        return RestAssured.given(spec)
                .when().get("/products/{uuid}", productUuid.toString());
    }

    @Step("Получить товар по сырой строке идентификатора: {rawUuid}")
    public Response getProductByRawId(String rawUuid) {
        return RestAssured.given(spec)
                .when().get("/products/{uuid}", rawUuid);
    }

    @Step("Получить список товаров: страница {page}, размер {size}")
    public Response getProducts(int page, int size) {
        return RestAssured.given(spec)
                .queryParam("page", page)
                .queryParam("size", size)
                .when().get("/products");
    }

    @Step("Получить список товаров: страница {page}, размер {size}, сортировка {order}, категория {categoryId}")
    public Response getProducts(int page, int size, String order, Long categoryId) {
        RequestSpecification request = RestAssured.given(spec)
                .queryParam("page", page)
                .queryParam("size", size);
        if (order != null) {
            request.queryParam("order", order);
        }
        if (categoryId != null) {
            request.queryParam("categoryId", categoryId);
        }
        return request.when().get("/products");
    }

    @Step("Получить товары текущего продавца")
    public Response getMyProducts() {
        return RestAssured.given(spec)
                .when().get("/products/mine");
    }

    @Step("Получить список категорий")
    public Response getCategories() {
        return RestAssured.given(spec)
                .when().get("/categories");
    }

    @Step("Создать товар")
    public Response createProduct(ProductCreateRequest request) {
        return RestAssured.given(spec)
                .body(request)
                .when().post("/products");
    }

    @Step("Создать товар из произвольного тела запроса")
    public Response createProductRaw(Object body) {
        return RestAssured.given(spec)
                .body(body)
                .when().post("/products");
    }

    @Step("Обновить товар {productUuid}")
    public Response updateProduct(UUID productUuid, ProductCreateRequest request) {
        return RestAssured.given(spec)
                .body(request)
                .when().patch("/products/{uuid}", productUuid.toString());
    }

    @Step("Создать товар и получить его идентификатор")
    public UUID createProductAndGetUuid(ProductCreateRequest request) {
        return UUID.fromString(
                createProduct(request)
                        .then().statusCode(200)
                        .extract().path("productUUID"));
    }
}
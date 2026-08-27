package com.scammers.productservice.data;
import org.junit.jupiter.params.provider.Arguments;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Stream;

public final class ProductDataProviders {

    private ProductDataProviders() {
    }

    public static Stream<Arguments> invalidProducts() {
        return Stream.of(
                Arguments.of("пустое название",
                        ProductTestData.createRequest("", "Описание", 10.0, 0L, 1L)),
                Arguments.of("название из пробелов",
                        ProductTestData.createRequest("   ", "Описание", 10.0, 0L, 1L)),
                Arguments.of("пустое описание",
                        ProductTestData.createRequest("Товар", "", 10.0, 0L, 1L)),
                Arguments.of("отрицательная цена",
                        ProductTestData.createRequest("Товар", "Описание", -1.0, 0L, 1L)),
                Arguments.of("цена ниже минимальной",
                        ProductTestData.createRequest("Товар", "Описание", 0.0, 0L, 1L))
        );
    }

    public static Stream<Arguments> incompleteRequestBodies() {
        return Stream.of(
                Arguments.of("нет названия", bodyWithout("title")),
                Arguments.of("нет описания", bodyWithout("description")),
                Arguments.of("нет цены", bodyWithout("price")),
                Arguments.of("нет категории", bodyWithout("categoryId")),
                Arguments.of("пустое тело", new HashMap<String, Object>())
        );
    }

    private static Map<String, Object> bodyWithout(String field) {
        Map<String, Object> body = new HashMap<>();
        body.put("title", "Товар");
        body.put("description", "Описание");
        body.put("price", 100.0);
        body.put("stock", 0);
        body.put("categoryId", 1L);
        body.remove(field);
        return body;
    }

    public static Stream<Arguments> orderParameters() {
        return Stream.of(
                Arguments.of("id", "сортировка по умолчанию"),
                Arguments.of("price", "по цене"),
                Arguments.of("title", "по названию"),
                Arguments.of("rating", "по рейтингу"),
                Arguments.of("price DESC", "с направлением"),
                Arguments.of("PRICE desc", "регистр не должен ломать разбор"),
                Arguments.of("unknown_column", "неизвестная колонка"),
                Arguments.of("id; DROP TABLE products", "попытка подставить свой SQL"),
                Arguments.of("id) UNION SELECT * FROM categories --", "попытка склеить чужую выборку"),
                Arguments.of("'", "одиночная кавычка")
        );
    }

    public static Stream<Arguments> pagingBoundaries() {
        return Stream.of(
                Arguments.of("отрицательная страница", -1, 20, 0, 20),
                Arguments.of("сильно отрицательная страница", -100, 20, 0, 20),
                Arguments.of("нулевой размер", 0, 0, 0, 20),
                Arguments.of("отрицательный размер", 0, -5, 0, 20),
                Arguments.of("минимальный размер", 0, 1, 0, 1),
                Arguments.of("обычный размер", 3, 50, 3, 50),
                Arguments.of("ровно максимум", 0, 100, 0, 100),
                Arguments.of("на единицу больше максимума", 0, 101, 0, 100),
                Arguments.of("абсурдный размер", 0, 100000, 0, 100)
        );
    }

    public static Stream<Arguments> pageSizes() {
        return Stream.of(
                Arguments.of(1), Arguments.of(9), Arguments.of(10), Arguments.of(11),
                Arguments.of(20), Arguments.of(46), Arguments.of(47), Arguments.of(48)
        );
    }
}

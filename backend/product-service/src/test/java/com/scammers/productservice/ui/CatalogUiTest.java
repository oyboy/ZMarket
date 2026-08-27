package com.scammers.productservice.ui;

import com.scammers.productservice.ui.steps.CatalogSteps;
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
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

@EnabledIfSystemProperty(named = "ui.enabled", matches = "true")
@Epic("Сервис товаров")
@Feature("Каталог в браузере")
@DisplayName("Каталог глазами пользователя")
class CatalogUiTest extends BaseUiTest {

    private CatalogSteps catalog;

    @BeforeEach
    void openCatalog() {
        catalog = new CatalogSteps(driver, wait, BASE_URL).openCatalog();
    }

    @Test
    @DisplayName("Каталог открывается и показывает товары")
    @Description("Самая базовая проверка витрины: пользователь видит непустой список")
    @Story("Отображение каталога")
    @Severity(SeverityLevel.BLOCKER)
    @TmsLink("TC_UI_01")
    void catalogShowsProducts() {
        assertThat(catalog.productCountOnPage())
                .as("на витрине должен быть хотя бы один товар — "
                        + "если пусто, тестовые данные не залиты")
                .isPositive();

        assertThat(catalog.titlesOnCurrentPage())
                .allSatisfy(title -> assertThat(title).isNotBlank());
    }

    @Test
    @DisplayName("Переход на следующую страницу меняет набор товаров")
    @Description("Проверяет, что навигация реально переключает данные, а не только подсвечивает номер")
    @Story("Навигация по страницам")
    @Severity(SeverityLevel.CRITICAL)
    @TmsLink("TC_UI_02")
    void nextPageShowsDifferentProducts() {
        assumeTrue(catalog.hasPagination(),
                "товаров меньше одной страницы — проверять навигацию не на чем");

        List<String> firstPage = catalog.titlesOnCurrentPage();
        int firstPageNumber = catalog.currentPage();

        catalog.goToNextPage();

        assertThat(catalog.currentPage()).isEqualTo(firstPageNumber + 1);
        assertThat(catalog.titlesOnCurrentPage())
                .as("вторая страница не должна повторять товары с первой")
                .doesNotContainAnyElementsOf(firstPage);
    }

    @Test
    @DisplayName("Возврат назад показывает ровно то же, что было")
    @Description("Проверяет, что состояние страницы восстанавливается точно, а не приблизительно")
    @Story("Навигация по страницам")
    @TmsLink("TC_UI_03")
    void backReturnsToSameContent() {
        assumeTrue(catalog.hasPagination() && catalog.totalPages() >= 2,
                "нужно минимум две страницы");

        List<String> firstPage = catalog.titlesOnCurrentPage();

        catalog.goToNextPage();
        catalog.goToPrevPage();

        assertThat(catalog.titlesOnCurrentPage())
                .as("возврат на первую страницу должен дать тот же список в том же порядке")
                .containsExactlyElementsOf(firstPage);
        assertThat(catalog.currentPage()).isEqualTo(1);
    }

    @Test
    @DisplayName("На первой странице кнопка «Назад» неактивна")
    @Story("Навигация по страницам")
    @TmsLink("TC_UI_04")
    void prevDisabledOnFirstPage() {
        assumeTrue(catalog.hasPagination(), "навигации нет");

        assertThat(catalog.currentPage()).isEqualTo(1);
        assertThat(catalog.isPrevEnabled())
                .as("с первой страницы некуда идти назад")
                .isFalse();
    }


    @Test
    @DisplayName("Обход всех страниц не показывает один товар дважды")
    @Description("Проверяет склейку страниц на стороне браузера — то, чего не видно на уровне API")
    @Story("Целостность выдачи в интерфейсе")
    @Severity(SeverityLevel.CRITICAL)
    @TmsLink("TC_UI_05")
    void fullCrawlHasNoDuplicates() {
        assumeTrue(catalog.hasPagination(), "навигации нет");

        List<String> duplicates = catalog.findDuplicatesAcrossPages();

        assertThat(duplicates)
                .as("эти товары встретились при обходе каталога больше одного раза")
                .isEmpty();
    }

    @Test
    @DisplayName("Несуществующий запрос даёт сообщение о пустой выдаче")
    @Description("Пустой результат должен объяснять пользователю, что произошло, а не показывать белый экран")
    @Story("Поиск по каталогу")
    @TmsLink("TC_UI_06")
    void searchWithNoResultsShowsEmptyState() {
        int countBeforeSearch = catalog.productCountOnPage();

        catalog.search("такого-товара-точно-нет-" + System.currentTimeMillis());

        assertThat(catalog.isEmptyStateShown())
                .as("на пустую выдачу должно показываться сообщение, а не белый экран")
                .isTrue();
        assertThat(catalog.productCountOnPage())
                .as("после поиска без совпадений товаров быть не должно (до поиска было %d)",
                        countBeforeSearch)
                .isZero();
    }

    @Test
    @DisplayName("[ожидаемо падает] Число страниц соответствует реальному объёму каталога")
    @Description("Дефект: фронт грузит только первые 100 товаров, поэтому навигация не может показать больше")
    @Story("Целостность выдачи в интерфейсе")
    @Severity(SeverityLevel.CRITICAL)
    @TmsLink("TC_UI_07")
    void totalPagesMatchesRealCatalogSize() {
        assumeTrue(catalog.hasPagination(), "навигации нет");

        int totalPagesInUi = catalog.totalPages();
        int pageSize = catalog.productCountOnPage();

        assertThat(totalPagesInUi * pageSize)
                .as("интерфейс показывает %d страниц по %d товаров — "
                                + "это ровно предел size=100, зашитый во фронте",
                        totalPagesInUi, pageSize)
                .isGreaterThan(100);
    }
}
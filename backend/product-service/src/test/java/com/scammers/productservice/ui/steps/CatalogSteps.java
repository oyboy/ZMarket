package com.scammers.productservice.ui.steps;

import com.scammers.productservice.ui.pages.CatalogPage;
import io.qameta.allure.Step;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public class CatalogSteps {
    private final CatalogPage catalog;
    private final String baseUrl;

    public CatalogSteps(WebDriver driver, WebDriverWait wait, String baseUrl) {
        this.catalog = new CatalogPage(driver, wait);
        this.baseUrl = baseUrl;
    }

    @Step("Открыть каталог")
    public CatalogSteps openCatalog() {
        catalog.open(baseUrl);
        return this;
    }

    @Step("Открыть каталог с фильтром по категории {categoryId}")
    public CatalogSteps openCategory(long categoryId) {
        catalog.openCategory(baseUrl, categoryId);
        return this;
    }

    @Step("Получить названия товаров на текущей странице")
    public List<String> titlesOnCurrentPage() {
        return catalog.productTitles();
    }

    @Step("Получить количество товаров на странице")
    public int productCountOnPage() {
        return catalog.productCount();
    }

    @Step("Перейти на следующую страницу")
    public CatalogSteps goToNextPage() {
        catalog.goToNextPage();
        return this;
    }

    @Step("Вернуться на предыдущую страницу")
    public CatalogSteps goToPrevPage() {
        catalog.goToPrevPage();
        return this;
    }

    @Step("Найти товары по запросу \"{query}\"")
    public CatalogSteps search(String query) {
        catalog.search(query);
        return this;
    }

    @Step("Проверить, показано ли сообщение о пустой выдаче")
    public boolean isEmptyStateShown() {
        return catalog.isEmptyStateShown();
    }

    @Step("Проверить, есть ли на странице навигация по страницам")
    public boolean hasPagination() {
        return catalog.isPaginationShown();
    }

    @Step("Получить номер текущей страницы")
    public int currentPage() {
        return catalog.currentPageNumber();
    }

    @Step("Получить общее число страниц")
    public int totalPages() {
        return catalog.totalPages();
    }

    @Step("Проверить, активна ли кнопка «Назад»")
    public boolean isPrevEnabled() {
        return catalog.isPrevEnabled();
    }

    @Step("Обойти каталог целиком и собрать названия со всех страниц")
    public List<List<String>> collectAllPages() {
        List<List<String>> pages = new ArrayList<>();
        int totalPages = catalog.totalPages();

        for (int page = 1; page <= totalPages; page++) {
            pages.add(catalog.productTitles());
            if (page < totalPages) {
                catalog.goToNextPage();
            }
        }
        return pages;
    }

    @Step("Найти товары, встретившиеся при обходе каталога дважды")
    public List<String> findDuplicatesAcrossPages() {
        Set<String> seen = new LinkedHashSet<>();
        List<String> duplicates = new ArrayList<>();

        for (List<String> page : collectAllPages()) {
            for (String title : page) {
                if (!seen.add(title)) {
                    duplicates.add(title);
                }
            }
        }
        return duplicates;
    }
}

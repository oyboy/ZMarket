package com.scammers.productservice.ui.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CatalogPage {
    private final WebDriver driver;
    private final WebDriverWait wait;

    private static final By PRODUCT_TITLES = By.cssSelector("h3 a[href^='/product/']");
    private static final By SEARCH_INPUT = By.cssSelector("input[placeholder*='Найти товары']");
    private static final By PAGE_INDICATOR =
            By.xpath("//span[contains(., 'Страница') and contains(., 'из')]");
    private static final By NEXT_BUTTON = By.xpath("//button[.//span[text()='Вперёд']]");
    private static final By PREV_BUTTON = By.xpath("//button[.//span[text()='Назад']]");
    private static final By LOADING_SKELETON = By.cssSelector(".animate-pulse");
    private static final By EMPTY_STATE = By.xpath("//h3[contains(text(), 'Товары не найдены')]");

    private static final Pattern PAGE_PATTERN = Pattern.compile("Страница\\s+(\\d+)\\s+из\\s+(\\d+)");

    public CatalogPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    public CatalogPage open(String baseUrl) {
        driver.get(baseUrl);
        return waitUntilLoaded();
    }

    public CatalogPage openCategory(String baseUrl, long categoryId) {
        driver.get(baseUrl + "/?categoryId=" + categoryId);
        return waitUntilLoaded();
    }

    public CatalogPage waitUntilLoaded() {
        wait.until(ExpectedConditions.invisibilityOfElementLocated(LOADING_SKELETON));
        wait.until(d -> !d.findElements(PRODUCT_TITLES).isEmpty()
                || !d.findElements(EMPTY_STATE).isEmpty());
        return this;
    }

    public List<String> productTitles() {
        return driver.findElements(PRODUCT_TITLES).stream()
                .map(WebElement::getText)
                .map(String::trim)
                .toList();
    }

    public int productCount() {
        return driver.findElements(PRODUCT_TITLES).size();
    }

    public boolean isEmptyStateShown() {
        return !driver.findElements(EMPTY_STATE).isEmpty();
    }

    public boolean isPaginationShown() {
        return !driver.findElements(PAGE_INDICATOR).isEmpty();
    }

    public int currentPageNumber() {
        return matchIndicator(1);
    }

    public int totalPages() {
        return matchIndicator(2);
    }

    private int matchIndicator(int group) {
        String text = wait.until(ExpectedConditions.visibilityOfElementLocated(PAGE_INDICATOR))
                .getText();
        Matcher matcher = PAGE_PATTERN.matcher(text);
        if (!matcher.find()) {
            throw new IllegalStateException("Не удалось разобрать указатель страниц: " + text);
        }
        return Integer.parseInt(matcher.group(group));
    }

    public boolean isNextEnabled() {
        WebElement button = findOrNull(NEXT_BUTTON);
        return button != null && button.isEnabled();
    }

    public boolean isPrevEnabled() {
        WebElement button = findOrNull(PREV_BUTTON);
        return button != null && button.isEnabled();
    }

    public CatalogPage goToNextPage() {
        List<String> before = productTitles();
        click(NEXT_BUTTON);
        waitForTitlesToChangeFrom(before);
        return this;
    }

    public CatalogPage goToPrevPage() {
        List<String> before = productTitles();
        click(PREV_BUTTON);
        waitForTitlesToChangeFrom(before);
        return this;
    }

    public CatalogPage search(String query) {
        WebElement input = wait.until(ExpectedConditions.elementToBeClickable(SEARCH_INPUT));
        input.clear();
        input.sendKeys(query);
        // поиск идёт по мере ввода: ждём, пока список перестроится
        wait.until(d -> !d.findElements(PRODUCT_TITLES).isEmpty()
                || !d.findElements(EMPTY_STATE).isEmpty());
        return this;
    }

    private void click(By locator) {
        wait.until(ExpectedConditions.elementToBeClickable(locator)).click();
    }

    private WebElement findOrNull(By locator) {
        try {
            return driver.findElement(locator);
        } catch (NoSuchElementException e) {
            return null;
        }
    }

    private void waitForTitlesToChangeFrom(List<String> before) {
        wait.until(d -> {
            List<String> now = d.findElements(PRODUCT_TITLES).stream()
                    .map(WebElement::getText)
                    .map(String::trim)
                    .toList();
            return !now.isEmpty() && !now.equals(before);
        });
    }
}
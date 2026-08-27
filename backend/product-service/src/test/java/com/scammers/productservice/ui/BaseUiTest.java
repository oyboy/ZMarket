package com.scammers.productservice.ui;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;

public abstract class BaseUiTest {
    protected WebDriver driver;
    protected WebDriverWait wait;

    protected static final String BASE_URL =
            System.getProperty("ui.base.url", "http://localhost:3000");

    private static final boolean HEADLESS =
            Boolean.parseBoolean(System.getProperty("ui.headless", "true"));

    private static final Duration EXPLICIT_WAIT = Duration.ofSeconds(15);
    private static final Duration PAGE_LOAD_TIMEOUT = Duration.ofSeconds(30);

    @BeforeEach
    void startBrowser() {
        ChromeOptions options = new ChromeOptions();
        if (HEADLESS) {
            options.addArguments("--headless=new");
        }
        options.addArguments(
                "--window-size=1920,1080",
                "--disable-gpu",
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--lang=ru-RU"
        );

        driver = new ChromeDriver(options);
        driver.manage().timeouts().pageLoadTimeout(PAGE_LOAD_TIMEOUT);

        wait = new WebDriverWait(driver, EXPLICIT_WAIT);
    }

    @AfterEach
    void stopBrowser() {
        if (driver != null) {
            driver.quit();
            driver = null;
        }
    }

    protected void takeScreenshot(String name) {
        if (!(driver instanceof TakesScreenshot screenshotTaker)) {
            return;
        }
        try {
            byte[] bytes = screenshotTaker.getScreenshotAs(OutputType.BYTES);
            Path target = Path.of("target", "screenshots", name + ".png");
            Files.createDirectories(target.getParent());
            Files.write(target, bytes);
        } catch (IOException e) {
            System.err.println("Не удалось сохранить скриншот: " + e.getMessage());
        }
    }
}

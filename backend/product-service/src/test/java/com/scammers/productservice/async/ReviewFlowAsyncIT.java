package com.scammers.productservice.async;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.scammers.productservice.configs.ObjectMapperFactory;
import com.scammers.productservice.data.ProductTestData;
import com.scammers.productservice.models.RatingApplier;
import com.scammers.productservice.models.enums.ApplyStatus;
import com.scammers.productservice.models.enums.ReviewStatus;
import com.scammers.productservice.services.ReviewsWatchdog;
import com.scammers.productservice.support.AbstractIntegrationTest;
import io.qameta.allure.Description;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Step;
import io.qameta.allure.Story;
import io.qameta.allure.TmsLink;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.context.TestPropertySource;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@EmbeddedKafka(partitions = 1, topics = {"ratings-results"})
@TestPropertySource(properties = {
        "spring.kafka.listener.auto-startup=true",
        "spring.kafka.bootstrap-servers=${spring.embedded.kafka.brokers}",
        "spring.kafka.consumer.auto-offset-reset=earliest"
})
@Epic("Сервис товаров")
@Feature("Асинхронная обработка отзывов")
@DisplayName("Обработка результатов оценки отзыва")
class ReviewFlowAsyncIT extends AbstractIntegrationTest {
    private static final Duration TIMEOUT = Duration.ofSeconds(10);

    private static final Duration POLL_INTERVAL = Duration.ofMillis(100);

    private static final Duration QUIET_PERIOD = Duration.ofSeconds(2);

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    @Autowired
    private ReviewsWatchdog watchdog;

    private final ObjectMapper objectMapper = ObjectMapperFactory.create();

    private Long categoryId;
    private UUID productId;
    private UUID userId;

    @BeforeEach
    void seedReview() {
        categoryId = ProductTestData.insertCategory(jdbc, "Электроника");
        productId = ProductTestData.insertProduct(jdbc, categoryId, "Товар с отзывом", 100.0);
        userId = UUID.randomUUID();
    }

    @Step("Создать отзыв в статусе {status}")
    private void insertReview(ReviewStatus status, int rating) {
        jdbc.update("""
                INSERT INTO product_reviews(user_id, product_id, rating, created_at, uploaded_at, comment, status)
                VALUES (?, ?, ?, now(), now(), 'текст отзыва', ?)
                """, userId, productId, rating, status.name());
    }

    @Step("Отправить результат {applyStatus} для ожидания {pendingStatus}")
    private void sendResult(ApplyStatus applyStatus, ReviewStatus pendingStatus) {
        try {
            String message = objectMapper.writeValueAsString(new RatingApplier(
                    applyStatus, pendingStatus, UUID.randomUUID(),
                    productId, userId, null, Instant.now()));
            kafkaTemplate.send("ratings-results", productId.toString(), message)
                    .get(5, TimeUnit.SECONDS);
        } catch (Exception e) {
            throw new IllegalStateException("Не удалось отправить сообщение в Kafka", e);
        }
    }

    private String currentStatus() {
        return jdbc.queryForObject("""
                SELECT status FROM product_reviews WHERE product_id = ? AND user_id = ?
                """, String.class, productId, userId);
    }

    @Step("Дождаться, пока статус отзыва станет {expected}")
    private void awaitStatus(String expected) {
        Awaitility.await("статус отзыва станет " + expected)
                .atMost(TIMEOUT)
                .pollInterval(POLL_INTERVAL)
                .untilAsserted(() -> assertThat(currentStatus()).isEqualTo(expected));
    }

    @Step("Убедиться, что статус остаётся {expected} и не меняется")
    private void assertStatusStaysAs(String expected) {
        Awaitility.await("статус остаётся " + expected)
                .atMost(QUIET_PERIOD.plusSeconds(1))
                .during(QUIET_PERIOD)
                .pollInterval(POLL_INTERVAL)
                .untilAsserted(() -> assertThat(currentStatus()).isEqualTo(expected));
    }

    @Nested
    @DisplayName("Основной путь")
    class HappyPath {

        @ParameterizedTest(name = "{0} + успех -> {1}")
        @CsvSource({
                "PENDING_PUB, PUBLISHED",
                "PENDING_DEL, DELETED"
        })
        @DisplayName("Успешный результат переводит отзыв в конечный статус")
        @Story("Применение результата оценки")
        @Severity(SeverityLevel.BLOCKER)
        @TmsLink("TC_ASYNC_01")
        void successMovesToFinalStatus(ReviewStatus pending, String expectedFinal) {
            insertReview(pending, 5);

            sendResult(ApplyStatus.SUCCESS, pending);

            awaitStatus(expectedFinal);
        }

        @ParameterizedTest(name = "{0} + отказ -> REJECTED")
        @CsvSource({"PENDING_PUB", "PENDING_DEL"})
        @DisplayName("Неуспешный результат отклоняет отзыв из любого ожидания")
        @Story("Применение результата оценки")
        @Severity(SeverityLevel.CRITICAL)
        @TmsLink("TC_ASYNC_02")
        void failureRejects(ReviewStatus pending) {
            insertReview(pending, 3);

            sendResult(ApplyStatus.FAILED, pending);

            awaitStatus("REJECTED");
        }
    }

    @Nested
    @DisplayName("Повторы и нарушенный порядок")
    class Idempotency {
        @Test
        @DisplayName("Повторное сообщение не обрабатывается второй раз")
        @Description("Дубликат в очереди неизбежен; обработчик обязан его отсечь, а не применить дважды")
        @Story("Идемпотентность обработки")
        @Severity(SeverityLevel.BLOCKER)
        @TmsLink("TC_ASYNC_03")
        void duplicateMessageIsIgnored() {
            insertReview(ReviewStatus.PENDING_PUB, 5);

            sendResult(ApplyStatus.SUCCESS, ReviewStatus.PENDING_PUB);
            awaitStatus("PUBLISHED");

            sendResult(ApplyStatus.SUCCESS, ReviewStatus.PENDING_PUB);
            assertStatusStaysAs("PUBLISHED");

            Long reviewRows = jdbc.queryForObject("""
                    SELECT count(*) FROM product_reviews WHERE product_id = ? AND user_id = ?
                    """, Long.class, productId, userId);
            assertThat(reviewRows)
                    .as("дубликат сообщения не должен порождать вторую запись отзыва")
                    .isEqualTo(1L);
        }

        @Test
        @DisplayName("Опоздавший отказ не отменяет уже опубликованный отзыв")
        @Description("Сообщения в очереди могут прийти не в том порядке, в каком отправлены")
        @Story("Идемпотентность обработки")
        @Severity(SeverityLevel.CRITICAL)
        @TmsLink("TC_ASYNC_04")
        void lateFailureDoesNotOverridePublished() {
            insertReview(ReviewStatus.PENDING_PUB, 5);

            sendResult(ApplyStatus.SUCCESS, ReviewStatus.PENDING_PUB);
            awaitStatus("PUBLISHED");

            sendResult(ApplyStatus.FAILED, ReviewStatus.PENDING_PUB);

            assertStatusStaysAs("PUBLISHED");
        }

        @Test
        @DisplayName("Опоздавший успех не воскрешает отклонённый отзыв")
        @Story("Идемпотентность обработки")
        @TmsLink("TC_ASYNC_05")
        void lateSuccessDoesNotOverrideRejected() {
            insertReview(ReviewStatus.PENDING_PUB, 3);

            sendResult(ApplyStatus.FAILED, ReviewStatus.PENDING_PUB);
            awaitStatus("REJECTED");

            sendResult(ApplyStatus.SUCCESS, ReviewStatus.PENDING_PUB);

            assertStatusStaysAs("REJECTED");
        }

        @Test
        @DisplayName("Результат для другого ожидания игнорируется")
        @Description("Отзыв ждёт публикации, а приходит результат удаления — применять его нельзя")
        @Story("Идемпотентность обработки")
        @TmsLink("TC_ASYNC_06")
        void mismatchedPendingStatusIsIgnored() {
            insertReview(ReviewStatus.PENDING_PUB, 5);

            sendResult(ApplyStatus.SUCCESS, ReviewStatus.PENDING_DEL);

            assertStatusStaysAs("PENDING_PUB");
        }
    }

    @Nested
    @DisplayName("Некорректные сообщения")
    class BadMessages {
        @Test
        @DisplayName("Битое сообщение не останавливает обработку следующих")
        @Description("Дефект такого рода останавливает всю очередь, а не одно сообщение")
        @Story("Устойчивость обработчика")
        @Severity(SeverityLevel.BLOCKER)
        @TmsLink("TC_ASYNC_07")
        void malformedMessageDoesNotBlockQueue() {
            insertReview(ReviewStatus.PENDING_PUB, 5);

            kafkaTemplate.send("ratings-results", productId.toString(), "{это не json}");
            kafkaTemplate.send("ratings-results", productId.toString(), "");

            sendResult(ApplyStatus.SUCCESS, ReviewStatus.PENDING_PUB);

            awaitStatus("PUBLISHED");
        }

        @Test
        @DisplayName("Результат для несуществующего отзыва не роняет обработчик")
        @Story("Устойчивость обработчика")
        @TmsLink("TC_ASYNC_08")
        void resultForUnknownReviewIsSafe() {
            sendResult(ApplyStatus.SUCCESS, ReviewStatus.PENDING_PUB);

            insertReview(ReviewStatus.PENDING_PUB, 4);
            sendResult(ApplyStatus.SUCCESS, ReviewStatus.PENDING_PUB);

            awaitStatus("PUBLISHED");
        }
    }

    @Nested
    @DisplayName("Класс проверки зависших отзывов")
    class Watchdog {
        @Test
        @DisplayName("Повторно публикует событие для зависшего отзыва")
        @Description("Сохранение идентификатора события обязательно: без него получатель не отличит повтор от нового события")
        @Story("Восстановление зависших отзывов")
        @Severity(SeverityLevel.CRITICAL)
        @TmsLink("TC_ASYNC_09")
        void republishesStuckReview() {
            insertStuckReview();
            UUID eventId = UUID.randomUUID();
            insertOutboxEvent(eventId);

            long before = countOutbox();

            watchdog.process();

            assertThat(countOutbox())
                    .as("сторож должен положить в outbox ровно одно новое событие")
                    .isEqualTo(before + 1);

            String lastPayload = jdbc.queryForObject("""
                    SELECT payload::text FROM outbox WHERE aggregate_id = ? ORDER BY created_at DESC LIMIT 1
                    """, String.class, productId);
            assertThat(lastPayload)
                    .as("идентификатор события должен сохраниться — иначе получатель "
                            + "не сможет отсечь дубликат")
                    .contains(eventId.toString());
        }

        @Test
        @DisplayName("Повторный прогон сразу подряд не плодит события")
        @Description("Защита от частых повторов: без неё сторож завалит очередь одинаковыми событиями")
        @Story("Восстановление зависших отзывов")
        @TmsLink("TC_ASYNC_10")
        void cooldownPreventsSpam() {
            insertStuckReview();
            insertOutboxEvent(UUID.randomUUID());

            watchdog.process();
            long afterFirstRun = countOutbox();

            watchdog.process();

            assertThat(countOutbox())
                    .as("второй прогон подряд должен быть отсечён")
                    .isEqualTo(afterFirstRun);
        }

        @Test
        @DisplayName("Зависший отзыв без события в outbox отклоняется")
        @Description("Если события нет, восстанавливать нечего — отзыв нельзя оставлять в ожидании навсегда")
        @Story("Восстановление зависших отзывов")
        @TmsLink("TC_ASYNC_11")
        void reviewWithoutEventIsRejected() {
            jdbc.update("""
                    INSERT INTO product_reviews(user_id, product_id, rating, created_at, uploaded_at, comment, status)
                    VALUES (?, ?, 2, now(), now() - interval '5 minutes', 'текст', 'PENDING_DEL')
                    """, userId, productId);

            watchdog.process();

            assertThat(currentStatus()).isEqualTo("REJECTED");
        }

        @Step("Создать зависший отзыв")
        private void insertStuckReview() {
            jdbc.update("""
                    INSERT INTO product_reviews(user_id, product_id, rating, created_at, uploaded_at, comment, status)
                    VALUES (?, ?, 4, now(), now() - interval '5 minutes', 'текст', 'PENDING_PUB')
                    """, userId, productId);
        }

        @Step("Положить в outbox старое событие")
        private void insertOutboxEvent(UUID eventId) {
            jdbc.update("""
                    INSERT INTO outbox(id, aggregate_id, aggregate_type, type, payload, created_at)
                    VALUES (?, ?, 'review', 'CREATED', cast(? as jsonb), now() - interval '10 minutes')
                    """, UUID.randomUUID(), productId, """
                    {"eventId":"%s","productId":"%s","userId":"%s","reviewPendingStatus":"PENDING_PUB","rating":4}
                    """.formatted(eventId, productId, userId));
        }

        private long countOutbox() {
            Long count = jdbc.queryForObject(
                    "SELECT count(*) FROM outbox WHERE aggregate_id = ?", Long.class, productId);
            return count == null ? 0L : count;
        }
    }
}

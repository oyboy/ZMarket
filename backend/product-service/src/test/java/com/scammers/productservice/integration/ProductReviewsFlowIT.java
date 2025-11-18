package com.scammers.productservice.integration;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scammers.productservice.configs.ObjectMapperFactory;
import com.scammers.productservice.models.RatingApplier;
import com.scammers.productservice.models.enums.ApplyStatus;
import com.scammers.productservice.models.enums.ReviewStatus;
import com.scammers.productservice.models.requests.ReviewCreateRequest;
import com.scammers.productservice.services.ReviewService;
import com.scammers.productservice.services.ReviewsWatchdog;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.test.EmbeddedKafkaBroker;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.Assert.assertThrows;

@SpringBootTest
@EmbeddedKafka(partitions = 1, topics = {"ratings-results"})
@Testcontainers
class ProductReviewsFlowIT {

    @Container
    static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", pg::getJdbcUrl);
        r.add("spring.datasource.username", pg::getUsername);
        r.add("spring.datasource.password", pg::getPassword);
        r.add("spring.kafka.consumer.auto-offset-reset", () -> "earliest");
    }

    @Autowired JdbcTemplate jdbc;
    @Autowired ReviewsWatchdog reviewsWatchdog;
    @Autowired EmbeddedKafkaBroker broker;
    @Autowired ReviewService reviewService;

    KafkaTemplate<String, String> kafka;
    ObjectMapper om = ObjectMapperFactory.create();

    @BeforeAll
    static void ddl(@Autowired JdbcTemplate jdbc) {
        jdbc.execute("""
            create table if not exists products (
              id bigserial primary key,
              product_uuid uuid not null unique,
              seller_id uuid not null,
              title varchar(255) not null,
              description text,
              price numeric(15,2) not null,
              stock int not null default 0,
              rating numeric(3,2) default 0
            );
        """);

        jdbc.execute("""
            create table if not exists product_reviews(
              id bigserial primary key,
              user_id uuid not null,
              product_id uuid not null,
              rating integer not null,
              created_at timestamp not null,
              uploaded_at timestamp,
              comment text,
              status varchar(25) not null,
              constraint product_reviews_products_fk
                foreign key (product_id) references products(product_uuid) on delete no action
            );
        """);

        jdbc.execute("""
            create table if not exists outbox(
              id uuid primary key,
              aggregate_id uuid not null,
              aggregate_type varchar(100) not null,
              type varchar(100) not null,
              payload jsonb not null,
              created_at timestamp not null default now()
            );
        """);

        jdbc.execute("""
            create table if not exists rating_applier_status (
              event_id uuid primary key,
              status varchar(25) not null,
              pending_status varchar(25) not null,
              product_uuid uuid not null,
              user_uuid uuid not null,
              exit_message text,
              created_at timestamptz not null default now()
            );
        """);
        jdbc.execute("""
            create index if not exists idx_review_operation_event_id on rating_applier_status(event_id);
        """);
    }

    @BeforeEach
    void setup() {
        var props = Map.<String, Object>of(
                "bootstrap.servers", broker.getBrokersAsString(),
                "key.serializer", "org.apache.kafka.common.serialization.StringSerializer",
                "value.serializer", "org.apache.kafka.common.serialization.StringSerializer"
        );
        kafka = new KafkaTemplate<>(new DefaultKafkaProducerFactory<>(props));

        jdbc.update("delete from rating_applier_status");
        jdbc.update("delete from outbox");
        jdbc.update("delete from product_reviews");
        jdbc.update("delete from products");
    }

    private void insertProduct(UUID productId) {
        jdbc.update("""
            insert into products(product_uuid, seller_id, title, description, price, stock, rating)
            values(?, ?, ?, ?, ?, ?, ?)
        """, productId, UUID.randomUUID(), "Test title", "Desc", new BigDecimal("123.45"), 10, new BigDecimal("0"));
    }
    private void insertProduct(UUID productId, UUID sellerId) {
        jdbc.update("""
        INSERT INTO products(product_uuid, seller_id, title, description, price, stock, rating)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, productId, sellerId, "Test Product", "For self-review test",
                new BigDecimal("999.99"), 1, BigDecimal.ZERO);
    }

    @Test
    void seller_cannot_review_own_product() {
        UUID productId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();

        insertProduct(productId, sellerId);

        var request = new ReviewCreateRequest((short) 5, "Сам себе пятёрку поставил!");

        var exception = assertThrows(AccessDeniedException.class, () -> {
            reviewService.saveReviewOnProduct(productId, sellerId, request);
        });

        assertThat(exception.getMessage())
                .isEqualTo("Вы не можете оценивать свой товар");

        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM product_reviews WHERE product_id = ? AND user_id = ?",
                Integer.class, productId, sellerId);
        assertThat(count).isZero();

        Integer outboxCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM outbox WHERE aggregate_id = ?",
                Integer.class, productId);
        assertThat(outboxCount).isZero();
    }

    @Test
    void success_publish() throws Exception {
        UUID productId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        insertProduct(productId);

        jdbc.update("""
            insert into product_reviews(user_id, product_id, rating, created_at, uploaded_at, comment, status)
            values(?, ?, 5, now(), now(), 'txt', 'PENDING_PUB')
        """, userId, productId);

        var msg = om.writeValueAsString(new RatingApplier(
                ApplyStatus.SUCCESS, ReviewStatus.PENDING_PUB, UUID.randomUUID(), productId, userId, null, Instant.now()
        ));
        kafka.send("ratings-results", productId.toString(), msg).get();

        Awaitility.await().atMost(Duration.ofSeconds(3)).untilAsserted(() -> {
            String st = jdbc.queryForObject("""
                select status from product_reviews where product_id=? and user_id=?
            """, String.class, productId, userId);
            assertThat(st).isEqualTo("PUBLISHED");
        });
    }

    @Test
    void success_delete() throws Exception {
        UUID productId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        insertProduct(productId);

        jdbc.update("""
            insert into product_reviews(user_id, product_id, rating, created_at, uploaded_at, comment, status)
            values(?, ?, 4, now(), now(), 'txt', 'PENDING_DEL')
        """, userId, productId);

        var msg = om.writeValueAsString(new RatingApplier(
                ApplyStatus.SUCCESS, ReviewStatus.PENDING_DEL, UUID.randomUUID(), productId, userId, null, Instant.now()
        ));
        kafka.send("ratings-results", productId.toString(), msg).get();

        Awaitility.await().atMost(Duration.ofSeconds(3)).untilAsserted(() -> {
            String st = jdbc.queryForObject("""
                select status from product_reviews where product_id=? and user_id=?
            """, String.class, productId, userId);
            assertThat(st).isEqualTo("DELETED");
        });
    }

    @Test
    void failed_any_pending_to_rejected() throws Exception {
        UUID productId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        insertProduct(productId);

        jdbc.update("""
            insert into product_reviews(user_id, product_id, rating, created_at, uploaded_at, comment, status)
            values(?, ?, 3, now(), now(), 'txt', 'PENDING_PUB')
        """, userId, productId);

        var msg = om.writeValueAsString(new RatingApplier(
                ApplyStatus.FAILED, ReviewStatus.PENDING_PUB, UUID.randomUUID(), productId, userId, "err", Instant.now()
        ));
        kafka.send("ratings-results", productId.toString(), msg).get();

        Awaitility.await().atMost(Duration.ofSeconds(3)).untilAsserted(() -> {
            String st = jdbc.queryForObject("""
                select status from product_reviews where product_id=? and user_id=?
            """, String.class, productId, userId);
            assertThat(st).isEqualTo("REJECTED");
        });
    }

    @Test
    void out_of_order_success_does_not_override() throws Exception {
        UUID productId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        insertProduct(productId);

        jdbc.update("""
            insert into product_reviews(user_id, product_id, rating, created_at, uploaded_at, comment, status)
            values(?, ?, 5, now(), now(), 'txt', 'PENDING_PUB')
        """, userId, productId);

        var msg = om.writeValueAsString(new RatingApplier(
                ApplyStatus.SUCCESS, ReviewStatus.PENDING_DEL, UUID.randomUUID(), productId, userId, null, Instant.now()
        ));
        kafka.send("ratings-results", productId.toString(), msg).get();

        Thread.sleep(400);
        String st = jdbc.queryForObject("""
            select status from product_reviews where product_id=? and user_id=?
        """, String.class, productId, userId);
        assertThat(st).isEqualTo("PENDING_PUB");
    }

    @Test
    void watchdog_republish_adds_outbox_row() {
        UUID productId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        insertProduct(productId);

        jdbc.update("""
            insert into product_reviews(user_id, product_id, rating, created_at, uploaded_at, comment, status)
            values(?, ?, 4, now(), now() - interval '5 minutes', 'txt', 'PENDING_PUB')
        """, userId, productId);

        String payload = """
          {
            "eventId":"%s",
            "productId":"%s",
            "userId":"%s",
            "reviewPendingStatus":"PENDING_PUB",
            "rating":4,
            "timestamp":"2025-01-01T00:00:00Z"
          }
        """.formatted(UUID.randomUUID(), productId, userId);
        jdbc.update("""
            insert into outbox(id, aggregate_id, aggregate_type, type, payload, created_at)
            values(?, ?, 'review', 'CREATED', cast(? as jsonb), now() - interval '4 minutes')
        """, UUID.randomUUID(), productId, payload);

        int before = jdbc.queryForObject("select count(*) from outbox where aggregate_id=?", Integer.class, productId);

        reviewsWatchdog.process();

        int after = jdbc.queryForObject("select count(*) from outbox where aggregate_id=?", Integer.class, productId);
        assertThat(after).isEqualTo(before + 1);
    }

    @Test
    void watchdog_no_payload_rejects() {
        UUID productId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        insertProduct(productId);

        jdbc.update("""
            insert into product_reviews(user_id, product_id, rating, created_at, uploaded_at, comment, status)
            values(?, ?, 2, now(), now() - interval '5 minutes', 'txt', 'PENDING_DEL')
        """, userId, productId);

        reviewsWatchdog.process();

        String st = jdbc.queryForObject("""
            select status from product_reviews where product_id=? and user_id=?
        """, String.class, productId, userId);
        assertThat(st).isEqualTo("REJECTED");
    }

    @Test
    void failed_after_success_does_not_override() throws Exception {
        UUID productId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        insertProduct(productId);

        jdbc.update("""
        insert into product_reviews(user_id, product_id, rating, created_at, uploaded_at, comment, status)
        values(?, ?, 5, now(), now(), 'txt', 'PENDING_PUB')
    """, userId, productId);

        // Сначала SUCCESS -> PUBLISHED
        var success = om.writeValueAsString(new RatingApplier(
                ApplyStatus.SUCCESS, ReviewStatus.PENDING_PUB, UUID.randomUUID(), productId, userId, null, Instant.now()
        ));
        kafka.send("ratings-results", productId.toString(), success).get();

        Awaitility.await().atMost(Duration.ofSeconds(3)).untilAsserted(() -> {
            String st = jdbc.queryForObject("select status from product_reviews where product_id=? and user_id=?",
                    String.class, productId, userId);
            assertThat(st).isEqualTo("PUBLISHED");
        });

        // Потом приходит FAILED (старый или поздний) — статус не должен вернуться в REJECTED
        var failed = om.writeValueAsString(new RatingApplier(
                ApplyStatus.FAILED, ReviewStatus.PENDING_PUB, UUID.randomUUID(), productId, userId, "late-fail", Instant.now()
        ));
        kafka.send("ratings-results", productId.toString(), failed).get();

        Thread.sleep(400);
        String st2 = jdbc.queryForObject("select status from product_reviews where product_id=? and user_id=?",
                String.class, productId, userId);
        assertThat(st2).isEqualTo("PUBLISHED");
    }

    @Test
    void success_after_failed_does_not_override() throws Exception {
        UUID productId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        insertProduct(productId);

        jdbc.update("""
        insert into product_reviews(user_id, product_id, rating, created_at, uploaded_at, comment, status)
        values(?, ?, 3, now(), now(), 'txt', 'PENDING_PUB')
    """, userId, productId);

        // Сначала FAILED -> REJECTED
        var failed = om.writeValueAsString(new RatingApplier(
                ApplyStatus.FAILED, ReviewStatus.PENDING_PUB, UUID.randomUUID(), productId, userId, "err", Instant.now()
        ));
        kafka.send("ratings-results", productId.toString(), failed).get();

        Awaitility.await().atMost(Duration.ofSeconds(3)).untilAsserted(() -> {
            String st = jdbc.queryForObject("select status from product_reviews where product_id=? and user_id=?",
                    String.class, productId, userId);
            assertThat(st).isEqualTo("REJECTED");
        });

        // Потом SUCCESS — не должен менять REJECTED
        var success = om.writeValueAsString(new RatingApplier(
                ApplyStatus.SUCCESS, ReviewStatus.PENDING_PUB, UUID.randomUUID(), productId, userId, null, Instant.now()
        ));
        kafka.send("ratings-results", productId.toString(), success).get();

        Thread.sleep(400);
        String st2 = jdbc.queryForObject("select status from product_reviews where product_id=? and user_id=?",
                String.class, productId, userId);
        assertThat(st2).isEqualTo("REJECTED");
    }

    @Test
    void duplicate_success_is_idempotent() throws Exception {
        UUID productId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        insertProduct(productId);

        jdbc.update("""
        insert into product_reviews(user_id, product_id, rating, created_at, uploaded_at, comment, status)
        values(?, ?, 5, now(), now(), 'txt', 'PENDING_PUB')
    """, userId, productId);

        var msg = om.writeValueAsString(new RatingApplier(
                ApplyStatus.SUCCESS, ReviewStatus.PENDING_PUB, UUID.randomUUID(), productId, userId, null, Instant.now()
        ));
        // дважды шлём SUCCESS
        kafka.send("ratings-results", productId.toString(), msg).get();
        kafka.send("ratings-results", productId.toString(), msg).get();

        Awaitility.await().atMost(Duration.ofSeconds(3)).untilAsserted(() -> {
            String st = jdbc.queryForObject("select status from product_reviews where product_id=? and user_id=?",
                    String.class, productId, userId);
            assertThat(st).isEqualTo("PUBLISHED");
        });
    }

    @Test
    void watchdog_cooldown_prevents_spam() {
        UUID productId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        insertProduct(productId);

        jdbc.update("""
        insert into product_reviews(user_id, product_id, rating, created_at, uploaded_at, comment, status)
        values(?, ?, 4, now(), now() - interval '5 minutes', 'txt', 'PENDING_PUB')
    """, userId, productId);

        String payload = """
      {"eventId":"%s","productId":"%s","userId":"%s","reviewPendingStatus":"PENDING_PUB","rating":4,"timestamp":"2025-01-01T00:00:00Z"}
    """.formatted(UUID.randomUUID(), productId, userId);
        jdbc.update("""
        insert into outbox(id, aggregate_id, aggregate_type, type, payload, created_at)
        values(?, ?, 'review', 'CREATED', cast(? as jsonb), now() - interval '10 minutes')
    """, UUID.randomUUID(), productId, payload);

        int before = jdbc.queryForObject("select count(*) from outbox where aggregate_id=?", Integer.class, productId);

        // 1-й прогон — должен добавить запись
        reviewsWatchdog.process();
        int mid = jdbc.queryForObject("select count(*) from outbox where aggregate_id=?", Integer.class, productId);
        assertThat(mid).isEqualTo(before + 1);

        // 2-й прогон сразу — не должен добавлять из-за cooldown
        reviewsWatchdog.process();
        int after = jdbc.queryForObject("select count(*) from outbox where aggregate_id=?", Integer.class, productId);
        assertThat(after).isEqualTo(mid);
    }

    @Test
    void watchdog_preserves_event_id_in_payload() throws JsonProcessingException {
        UUID productId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        insertProduct(productId);

        jdbc.update("""
        insert into product_reviews(user_id, product_id, rating, created_at, uploaded_at, comment, status)
        values(?, ?, 4, now(), now() - interval '5 minutes', 'txt', 'PENDING_PUB')
    """, userId, productId);

        UUID eventId = UUID.randomUUID();
        String payload = """
      {"eventId":"%s","productId":"%s","userId":"%s","reviewPendingStatus":"PENDING_PUB","rating":4}
    """.formatted(eventId, productId, userId);
        jdbc.update("""
        insert into outbox(id, aggregate_id, aggregate_type, type, payload, created_at)
        values(?, ?, 'review', 'CREATED', cast(? as jsonb), now() - interval '10 minutes')
    """, UUID.randomUUID(), productId, payload);

        reviewsWatchdog.process();

        // достаём самый свежий outbox по aggregate_id
        String repPayload = jdbc.queryForObject("""
        select payload::text from outbox where aggregate_id=? order by created_at desc limit 1
    """, String.class, productId);

        String repEventId = om.readTree(repPayload).get("eventId").asText();
        assertThat(repEventId).isEqualTo(eventId.toString());
    }

    @Test
    void watchdog_uses_payload_matching_pending_status() throws JsonProcessingException {
        UUID productId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        insertProduct(productId);

        // запись в PENDING_DEL
        jdbc.update("""
        insert into product_reviews(user_id, product_id, rating, created_at, uploaded_at, comment, status)
        values(?, ?, 4, now(), now() - interval '5 minutes', 'txt', 'PENDING_DEL')
    """, userId, productId);

        // outbox с PENDING_PUB (не должен выбраться)
        jdbc.update("""
        insert into outbox(id, aggregate_id, aggregate_type, type, payload, created_at)
        values(?, ?, 'review', 'CREATED', cast(? as jsonb), now() - interval '10 minutes')
    """, UUID.randomUUID(), productId, """
      {"eventId":"%s","productId":"%s","userId":"%s","reviewPendingStatus":"PENDING_PUB","rating":5}
    """.formatted(UUID.randomUUID(), productId, userId));

        // outbox с PENDING_DEL (должен выбраться)
        UUID chosenEvent = UUID.randomUUID();
        jdbc.update("""
        insert into outbox(id, aggregate_id, aggregate_type, type, payload, created_at)
        values(?, ?, 'review', 'DELETED', cast(? as jsonb), now() - interval '9 minutes')
    """, UUID.randomUUID(), productId, """
      {"eventId":"%s","productId":"%s","userId":"%s","reviewPendingStatus":"PENDING_DEL","rating":4}
    """.formatted(chosenEvent, productId, userId));

        int before = jdbc.queryForObject("select count(*) from outbox where aggregate_id=?", Integer.class, productId);

        reviewsWatchdog.process();

        String lastPayload = jdbc.queryForObject("""
        select payload::text from outbox where aggregate_id=? order by created_at desc limit 1
    """, String.class, productId);
        assertThat(om.readTree(lastPayload).get("eventId").asText()).isEqualTo(chosenEvent.toString());

        int after = jdbc.queryForObject("select count(*) from outbox where aggregate_id=?", Integer.class, productId);
        assertThat(after).isEqualTo(before + 1);
    }
}
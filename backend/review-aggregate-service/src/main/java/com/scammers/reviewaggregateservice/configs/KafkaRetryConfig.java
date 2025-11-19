package com.scammers.reviewaggregateservice.configs;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scammers.reviewaggregateservice.models.RatingApplier;
import com.scammers.reviewaggregateservice.models.enums.ApplyStatus;
import com.scammers.reviewaggregateservice.models.enums.PendingStatus;
import org.apache.kafka.common.TopicPartition;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.ConsumerRecordRecoverer;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.ExponentialBackOffWithMaxRetries;

import java.time.Instant;
import java.util.UUID;

@Configuration
@EnableKafka
public class KafkaRetryConfig {
    @Bean
    public DefaultErrorHandler errorHandler(KafkaTemplate<String, String> template, ObjectMapper mapper) {
        var backoff = new ExponentialBackOffWithMaxRetries(5);
        backoff.setInitialInterval(100L);
        backoff.setMultiplier(2.0);
        backoff.setMaxInterval(2000L);

        ConsumerRecordRecoverer recoverer = (record, exception) -> {
            try {
                JsonNode root = mapper.readTree(String.valueOf(record.value()));
                JsonNode payload = root.get("payload");
                if (payload != null && payload.isTextual()) payload = mapper.readTree(payload.asText());
                if (payload == null) payload = root;

                UUID eventId = UUID.fromString(payload.get("eventId").asText());
                UUID productId = UUID.fromString(payload.get("productId").asText());
                UUID userId = UUID.fromString(payload.get("userId").asText());
                String ps = payload.get("reviewPendingStatus").asText();
                PendingStatus pending = PendingStatus.valueOf(ps);

                RatingApplier failed = new RatingApplier(ApplyStatus.FAILED, pending, eventId, productId, userId,
                        truncate(exception.getMessage()), Instant.now());
                String json = mapper.writeValueAsString(failed);

                template.send("ratings-results", productId.toString(), json);
            } catch (Exception e2) {
                // лог
                System.err.println(e2.getMessage());
            }

            new DeadLetterPublishingRecoverer(template,
                    (r, e) -> new TopicPartition("reviews-events.DLT", r.partition()))
                    .accept(record, exception);
        };

        return new DefaultErrorHandler(recoverer, backoff);
    }

    private static String truncate(String s) {
        if (s == null) return null;
        return s.length() > 500 ? s.substring(0, 500) : s;
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory(
            ConsumerFactory<String, String> cf, DefaultErrorHandler errorHandler) {
        var f = new ConcurrentKafkaListenerContainerFactory<String, String>();
        f.setConsumerFactory(cf);
        f.setCommonErrorHandler(errorHandler);
        return f;
    }
}
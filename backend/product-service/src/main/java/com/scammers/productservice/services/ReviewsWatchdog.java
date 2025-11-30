package com.scammers.productservice.services;

import com.scammers.productservice.models.dtos.OutboxEventRow;
import com.scammers.productservice.models.dtos.PendingReviewRow;
import com.scammers.productservice.models.enums.ReviewStatus;
import com.scammers.productservice.repositories.OutboxRepository;
import com.scammers.productservice.repositories.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewsWatchdog {
    private final ReviewRepository reviewsRepo;
    private final OutboxRepository outboxRepo;

    // Сколько «висеть» в pending, чтобы считалось застрявшим
    @Value("${watchdog.pending.ttl.seconds:120}")
    private long pendingTtlSec;

    // Защита от частых репаблишей одного и того же события
    @Value("${watchdog.cooldown.seconds:30}")
    private long republishCooldownSec;

    // За один проход обрабатываем не больше N записей
    @Value("${watchdog.batch.limit:300}")
    private int batchLimit;

    @Scheduled(fixedDelayString = "${watchdog.interval.ms:60000}")
    @Transactional
    public void process() {
        Duration ttl = Duration.ofSeconds(pendingTtlSec);
        Duration cooldown = Duration.ofSeconds(republishCooldownSec);

        List<PendingReviewRow> stale = reviewsRepo.findStalePending(ttl, batchLimit);
        if (stale.isEmpty()) return;

        int republished = 0;
        int rejected = 0;

        for (PendingReviewRow row : stale) {
            boolean pendingPub = (row.status() == ReviewStatus.PENDING_PUB);
            if (outboxRepo.hasRecentFor(row.productId(), row.userId(), row.status(), cooldown)) {
                continue;
            }

            var last = outboxRepo.findLatestFor(row.productId(), row.userId(), row.status());
            if (last.isEmpty()) {
                reviewsRepo.rejectIfPending(row.id());
                rejected++;
                continue;
            }

            OutboxEventRow ev = last.get();
            outboxRepo.insertOutbox(row.productId(), ev.type(), ev.payload());
            republished++;
        }

        log.info("Watchdog processed: stale={}, republished={}, rejected={}",
                stale.size(), republished, rejected);
    }
}
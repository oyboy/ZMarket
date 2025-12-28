package com.scammers.recservice.services;

import com.scammers.commonkafkaevents.OrderItemEventDto;
import com.scammers.commonkafkaevents.OrderPaidEvent;
import com.scammers.recservice.controllers.ProductClient;
import com.scammers.recservice.models.*;
import com.scammers.recservice.models.responses.ProductInfo;
import com.scammers.recservice.repositories.ProcessedOrderEventRepository;
import com.scammers.recservice.repositories.ProductOrderStatsRepository;
import com.scammers.recservice.repositories.UserOrderProfileRepository;
import com.scammers.recservice.repositories.UserProductOrdersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RecommendationsStatsService {
    private final ProductOrderStatsRepository productStatsRepo;
    private final UserProductOrdersRepository userProductRepo;
    private final UserOrderProfileRepository profileRepo;
    private final ProcessedOrderEventRepository processedRepo;
    private final ProductClient productClient;

    @Transactional
    public void process(OrderPaidEvent ev) {
        UUID eventId = UUID.fromString(ev.getOrderId());
        if (processedRepo.findById(eventId).isPresent()) return;

        UUID userId = ev.getUserId();

        for (OrderItemEventDto item : ev.getItems()) {
            UUID productId = UUID.fromString(item.getProductId());

            ProductInfo info = productClient.getProductInfo(productId);
            Long categoryId = info.categoryId();
            UUID manufacturerId = info.manufacturerId();

            Instant ts = Instant.now();

            // 1) product_order_stats
            ProductOrderStats ps = productStatsRepo.findById(productId)
                    .orElseGet(() -> {
                        ProductOrderStats p = new ProductOrderStats();
                        p.setProductUuid(productId);
                        p.setCategoryId(categoryId);
                        p.setManufacturerUuid(manufacturerId);
                        return p;
                    });
            ps.setOrdersCnt(ps.getOrdersCnt() + item.getQuantity());
            if (ts.isAfter(ps.getLastOrderAt())) {
                ps.setLastOrderAt(ts);
            }
            productStatsRepo.save(ps);

            // 2) user_product_orders
            var upId = new UserProductOrders.UserProductOrdersId();
            upId.setUserUuid(userId);
            upId.setProductUuid(productId);

            UserProductOrders up = userProductRepo.findById(upId)
                    .orElseGet(() -> {
                        UserProductOrders u = new UserProductOrders();
                        u.setId(upId);
                        return u;
                    });
            up.setOrdersCnt(up.getOrdersCnt() + item.getQuantity());
            up.setLastOrderAt(ts);
            userProductRepo.save(up);

            // 3) user_order_profile (если нужно по категориям/производителям)
            var prId = new UserOrderProfile.UserOrderProfileId();
            prId.setUserUuid(userId);
            prId.setCategoryId(categoryId);
            prId.setManufacturerUuid(manufacturerId);

            UserOrderProfile prof = profileRepo.findById(prId)
                    .orElseGet(() -> {
                        UserOrderProfile p = new UserOrderProfile();
                        p.setId(prId);
                        return p;
                    });
            prof.setOrdersCnt(prof.getOrdersCnt() + item.getQuantity());
            prof.setLastOrderAt(ts);
            profileRepo.save(prof);
        }

        processedRepo.save(new ProcessedOrderEvent(eventId));
    }
}

package com.scammers.recservice.services;

import com.scammers.commonkafkaevents.OrderItemEventDto;
import com.scammers.commonkafkaevents.OrderPaidEvent;
import com.scammers.recservice.controllers.ProductClient;
import com.scammers.recservice.models.*;
import com.scammers.recservice.models.responses.ProductInfo;
import com.scammers.recservice.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RecommendationsStatsService {
    private final ProductOrderStatsRepository productStatsRepo;
    private final UserProductOrdersRepository userProductRepo;
    private final UserOrderProfileRepository profileRepo;
    private final ProcessedOrderEventRepository processedRepo;
    private final SellerProductDailyStatsRepository statsRepo;
    private final ProductClient productClient;

    @Transactional
    public void process(OrderPaidEvent ev) {
        UUID eventId = UUID.fromString(ev.getOrderId());
        Instant ts = Instant.now();
        if (processedRepo.findById(eventId).isPresent()) return;

        UUID userId = ev.getUserId();

        for (OrderItemEventDto item : ev.getItems()) {
            UUID productId = UUID.fromString(item.getProductId());

            ProductInfo info = productClient.getProductInfo(productId);
            Long categoryId = info.categoryId();
            UUID manufacturerId = info.manufacturerId();
            int qty = item.getQuantity();

            // product_order_stats
            ProductOrderStats ps = productStatsRepo.findById(productId)
                    .orElseGet(() -> {
                        ProductOrderStats p = new ProductOrderStats();
                        p.setProductUuid(productId);
                        p.setCategoryId(categoryId);
                        p.setManufacturerUuid(manufacturerId);
                        return p;
                    });
            ps.setOrdersCnt(ps.getOrdersCnt() + 1);
            ps.setQuantitySum(ps.getQuantitySum() + qty);
            if (ts.isAfter(ps.getLastOrderAt())) {
                ps.setLastOrderAt(ts);
            }
            productStatsRepo.save(ps);

            // seller_product_daily_stats
            LocalDate day = ts.atZone(ZoneOffset.UTC).toLocalDate();
            var id = new SellerProductDailyStats.Id();
            id.setSellerUuid(manufacturerId);
            id.setProductUuid(productId);
            id.setDay(day);

            SellerProductDailyStats daily = statsRepo.findById(id)
                    .orElseGet(() -> {
                        var d = new SellerProductDailyStats();
                        d.setId(id);
                        return d;
                    });
            daily.setOrdersCnt(daily.getOrdersCnt() + 1);
            daily.setQuantitySum(daily.getQuantitySum() + qty);
            statsRepo.save(daily);

            // user_product_orders
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

            // user_order_profile
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

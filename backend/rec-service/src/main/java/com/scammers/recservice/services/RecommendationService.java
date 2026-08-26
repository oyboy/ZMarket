package com.scammers.recservice.services;

import com.scammers.recservice.models.ProductOrderStats;
import com.scammers.recservice.models.UserOrderProfile;
import com.scammers.recservice.repositories.ProductOrderStatsRepository;
import com.scammers.recservice.repositories.UserOrderProfileRepository;
import com.scammers.recservice.repositories.UserProductOrdersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationService {
    private final UserOrderProfileRepository profileRepo;
    private final ProductOrderStatsRepository productStatsRepo;
    private final UserProductOrdersRepository userProductRepo;

    @Transactional(readOnly = true)
    public List<UUID> getGlobalPopular(int limit) {
        return productStatsRepo.findTopN(limit).stream()
                .map(ProductOrderStats::getProductUuid)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UUID> recommendForUser(UUID userId, int limit) {
        List<UserOrderProfile> segments = profileRepo
                .findTop5ByIdUserUuidOrderByOrdersCntDescLastOrderAtDesc(userId);

        if (segments.isEmpty()) {
            return productStatsRepo.findTop20ByOrderByOrdersCntDescLastOrderAtDesc()
                    .stream()
                    .limit(limit)
                    .map(ProductOrderStats::getProductUuid)
                    .toList();
        }

        Set<Pair<Long, UUID>> segKeys = segments.stream()
                .map(s -> Pair.of(
                        s.getId().getCategoryId(),
                        s.getId().getManufacturerUuid()))
                .collect(Collectors.toSet());

        Set<UUID> alreadyBought = userProductRepo
                .findTop100ByIdUserUuidOrderByLastOrderAtDesc(userId)
                .stream()
                .map(up -> up.getId().getProductUuid())
                .collect(Collectors.toSet());

        return productStatsRepo.findTop20ByOrderByOrdersCntDescLastOrderAtDesc()
                .stream()
                .filter(p -> segKeys.contains(Pair.of(
                        p.getCategoryId(), p.getManufacturerUuid())))
                .filter(p -> !alreadyBought.contains(p.getProductUuid()))
                .limit(limit)
                .map(ProductOrderStats::getProductUuid)
                .toList();
    }
}
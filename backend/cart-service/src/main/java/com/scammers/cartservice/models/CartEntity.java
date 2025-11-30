package com.scammers.cartservice.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RedisHash(value = "carts", timeToLive = 86400)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartEntity implements Serializable {
    @Id
    private UUID userId;

    private List<CartItemEntity> items = new ArrayList<>();

    public Optional<CartItemEntity> findItem(UUID productId) {
        return items.stream()
                .filter(item -> item.getProductId().equals(productId))
                .findFirst();
    }

    public void addOrUpdateItem(CartItemEntity newItem) {
        items.removeIf(i -> i.getProductId().equals(newItem.getProductId()));
        items.add(newItem);
    }
}

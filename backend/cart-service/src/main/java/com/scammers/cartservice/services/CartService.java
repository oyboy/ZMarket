package com.scammers.cartservice.services;

import com.scammers.cartservice.controllers.ProductClient;
import com.scammers.cartservice.controllers.UserClient;
import com.scammers.cartservice.models.CartEntity;
import com.scammers.cartservice.models.CartItemEntity;
import com.scammers.cartservice.models.dtos.CartDto;
import com.scammers.cartservice.models.dtos.CartItemDto;
import com.scammers.cartservice.models.responses.ProductResponse;
import com.scammers.cartservice.models.responses.SellerInfoResponse;
import com.scammers.cartservice.repositories.CartRepository;
import jakarta.ws.rs.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CartService {
    @Value("${services.product-service.url}")
    private String productServiceUrl;

    private final CartRepository cartRepository;
    private final ProductClient productClient;
    private final UserClient userClient;

    public CartDto addToCart(UUID userId, UUID productId, int quantityToAdd) {
        if (quantityToAdd <= 0) throw new BadRequestException("Количество должно быть > 0");

        ProductResponse product = productClient.getProduct(productId);
        SellerInfoResponse sellerInfo = userClient.getSellerInfo(product.sellerId()).data();

        CartEntity cart = cartRepository.findById(userId)
                .orElse(new CartEntity(userId, new ArrayList<>()));

        Optional<CartItemEntity> existingItemOpt = cart.findItem(productId);

        int currentQty = existingItemOpt.map(CartItemEntity::getQuantity).orElse(0);
        int newQty = currentQty + quantityToAdd;

        if (product.stock() < newQty) {
            throw new BadRequestException("Недостаточно товара. Доступно всего: " + product.stock());
        }

        String mainImageId = productClient.getMainImageId(productId);
        String imageUrl = mainImageId != null
                ? productServiceUrl + "/api/v1/products/attachments/download?key=" + mainImageId
                : null;

        CartItemEntity item = CartItemEntity.builder()
                .productId(productId)
                .sellerId(product.sellerId())
                .quantity(newQty)
                .title(product.title())
                .price(product.price())
                .sellerName(sellerInfo.sellerName())
                .imageUrl(imageUrl)
                .build();

        cart.addOrUpdateItem(item);

        cartRepository.save(cart);
        return mapToDto(cart);
    }

    public CartDto getCart(UUID userId) {
        CartEntity cart = cartRepository.findById(userId)
                .orElse(new CartEntity(userId, new ArrayList<>()));
        return mapToDto(cart);
    }

    private CartDto mapToDto(CartEntity entity) {
        List<CartItemDto> items = entity.getItems().stream()
                .map(i -> new CartItemDto(
                        i.getProductId(), i.getSellerId(), i.getTitle(), i.getPrice(),
                        i.getQuantity(), i.getImageUrl(), i.getSellerName()
                ))
                .toList();

        BigDecimal total = items.stream()
                .map(i -> i.getPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CartDto(items, items.stream().mapToInt(CartItemDto::getQuantity).sum(), total);
    }

    public CartDto removeFromCart(UUID userId, UUID productId) {
        CartEntity cart = cartRepository.findById(userId)
                .orElse(new CartEntity(userId, new ArrayList<>()));

        boolean removed = cart.getItems().removeIf(item -> item.getProductId().equals(productId));

        if (removed) {
            cartRepository.save(cart);
        }

        return mapToDto(cart);
    }

    public CartDto setQuantity(UUID userId, UUID productId, int quantity) {
        CartEntity cart = cartRepository.findById(userId)
                .orElse(new CartEntity(userId, new ArrayList<>()));

        if (quantity <= 0) {
            cart.getItems().removeIf(item -> item.getProductId().equals(productId));
        }

        CartItemEntity item = cart.findItem(productId)
                .orElseThrow(() -> new BadRequestException("Товар не найден в корзине"));
        ProductResponse product = productClient.getProduct(productId);

        if (product.stock() < quantity) {
            throw new BadRequestException("Недостаточно товара. Доступно: " + product.stock());
        }

        item.setQuantity(quantity);
        cartRepository.save(cart);

        return mapToDto(cart);
    }

    public void clearCart(UUID userId) {
        cartRepository.deleteById(userId);
    }
}

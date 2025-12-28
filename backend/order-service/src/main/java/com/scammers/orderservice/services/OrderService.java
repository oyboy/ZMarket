package com.scammers.orderservice.services;

import com.scammers.commonkafkaevents.OrderCancelledEvent;
import com.scammers.commonkafkaevents.OrderItemEventDto;
import com.scammers.commonkafkaevents.OrderPaidEvent;
import com.scammers.orderservice.controllers.CartClient;
import com.scammers.orderservice.controllers.UserClient;
import com.scammers.orderservice.controllers.WarehouseClient;
import com.scammers.orderservice.enums.OrderStatus;
import com.scammers.orderservice.models.CustomerDetails;
import com.scammers.orderservice.models.Order;
import com.scammers.orderservice.models.OrderItem;
import com.scammers.orderservice.models.SellerOrderView;
import com.scammers.orderservice.models.dtos.CartDto;
import com.scammers.orderservice.models.dtos.OrderDto;
import com.scammers.orderservice.models.dtos.OrderItemDto;
import com.scammers.orderservice.models.requests.StockOperationRequest;
import com.scammers.orderservice.repositories.OrderItemRepository;
import com.scammers.orderservice.repositories.OrderRepository;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartClient cartClient;
    private final UserClient userClient;
    private final WarehouseClient warehouseClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    private static final long ORDER_TTL_MINUTES = 30;

    @Transactional
    public OrderDto createOrder(UUID userId, String address) {
        CartDto cart = cartClient.getCart();
        if (cart.getCartItems() == null || cart.getCartItems().isEmpty()) {
            throw new BadRequestException("Корзина пуста");
        }

        CustomerDetails userInfo = userClient.getUserContactInfo(userId).data();
        log.info("User info: {}", userInfo);

        Order order = new Order();
        order.setUserId(userId);
        order.setCustomerDetails(userInfo);
        order.setStatus(OrderStatus.CREATED);
        order.setDeliveryAddress(address);
        order.setExpiresAt(LocalDateTime.now().plusMinutes(ORDER_TTL_MINUTES));
        order.setTotalPrice(cart.getTotalPrice());

        List<OrderItem> items = cart.getCartItems().stream()
                .map(ci -> OrderItem.builder()
                        .order(order)
                        .productId(ci.getProductId())
                        .sellerId(ci.getSellerId())
                        .quantity(ci.getQuantity())
                        .price(ci.getPrice())
                        .productTitle(ci.getTitle())
                        .build())
                .collect(Collectors.toList());
        order.setItems(items);

        log.info("Saving order: {}", order);
        orderRepository.save(order);

        try {
            log.info("reserving items");
            reserveItems(order.getId(), items);
            log.info("items reserved");

            order.setStatus(OrderStatus.PENDING_PAYMENT);
            orderRepository.save(order);
            log.info("Changed status to pending payment");

            cartClient.clearCart();
            log.info("Order {} created and reserved", order.getId());
            return mapToDto(order);

        } catch (Exception e) {
            log.error("Failed to reserve items for order {}. Rolling back.", order.getId(), e);
            order.setStatus(OrderStatus.CANCELLED);
            orderRepository.save(order);

            throw new BadRequestException("Не удалось зарезервировать товары. Возможно, они закончились.");
        }
    }

    @Transactional
    public void confirmPayment(String orderId) {
        Order order = orderRepository.findById(UUID.fromString(orderId))
                .orElseThrow(() -> new NotFoundException("Order not found"));

        if (order.getStatus() == OrderStatus.PAID) return;
        if (order.getStatus() == OrderStatus.CANCELLED) {
            log.warn("Payment for cancelled order {}", orderId);
            return;
        }

        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);

        OrderPaidEvent event = new OrderPaidEvent(orderId, order.getUserId(), mapToEventItems(order.getItems()));
        kafkaTemplate.send("order-paid-events", event);
    }

    @Transactional(readOnly = true)
    public OrderDto getOrderById(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));
        return mapToDto(order);
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getUserOrders(UUID userId) {
        return orderRepository.findAllByUserId(userId).stream()
                .map(this::mapToDto)
                .toList();
    }

    private void reserveItems(UUID orderId, List<OrderItem> items) {
        List<OrderItem> reservedItems = new ArrayList<>();

        try {
            for (OrderItem item : items) {
                warehouseClient.reserve(new StockOperationRequest(
                        item.getProductId(),
                        item.getQuantity(),
                        orderId
                ));
                reservedItems.add(item);
            }
        } catch (Exception e) {
            for (OrderItem item : reservedItems) {
                try {
                    warehouseClient.release(new StockOperationRequest(
                            item.getProductId(),
                            item.getQuantity(),
                            orderId
                    ));
                } catch (Exception ex) {
                    log.error("CRITICAL: Failed to rollback reservation for item {}", item.getProductId());
                }
            }
            throw e;
        }
    }

    @Transactional
    public void cancelOrder(String orderId, String reason) {
        Order order = orderRepository.findById(UUID.fromString(orderId))
                .orElseThrow(() -> new NotFoundException("Order not found"));

        if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.PAID) {
            return;
        }

        log.info("Cancelling order {}. Reason: {}", orderId, reason);
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);

        OrderCancelledEvent event = new OrderCancelledEvent(order.getId().toString(), mapToEventItems(order.getItems()));
        kafkaTemplate.send("order-cancelled-events", event);
    }

    @Transactional(readOnly = true)
    public List<SellerOrderView> getOrdersForSeller(UUID sellerId) {
        List<OrderItem> items = orderItemRepository.findAllBySellerId(sellerId);

        return items.stream()
                .map(item -> {
                    Order order = item.getOrder();
                    var customer = order.getCustomerDetails();

                    return SellerOrderView.builder()
                            // Данные заказа
                            .orderId(order.getId())
                            .createdAt(order.getCreatedAt())
                            .status(order.getStatus())
                            .deliveryAddress(order.getDeliveryAddress())

                            // Данные покупателя
                            .customerName(customer.getFullName())
                            .customerPhone(customer.getPhone())
                            .customerEmail(customer.getEmail())

                            // Данные товара
                            .productId(item.getProductId())
                            .productTitle(item.getProductTitle())
                            .quantity(item.getQuantity())
                            .price(item.getPrice())
                            .totalItemPrice(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                            .build();
                })
                .toList();
    }

    private OrderDto mapToDto(Order order) {
        return OrderDto.builder()
                .id(order.getId())
                .userId(order.getUserId())
                .status(order.getStatus())
                .totalPrice(order.getTotalPrice())
                .deliveryAddress(order.getDeliveryAddress())
                .createdAt(order.getCreatedAt())
                .expiresAt(order.getExpiresAt())
                .items(mapItemsToDto(order.getItems()))
                .build();
    }

    private List<OrderItemDto> mapItemsToDto(List<OrderItem> items) {
        return items.stream()
                .map(i -> OrderItemDto.builder()
                        .productId(i.getProductId())
                        .quantity(i.getQuantity())
                        .price(i.getPrice())
                        .title(i.getProductTitle())
                        .build())
                .toList();
    }
    private List<OrderItemEventDto> mapToEventItems(List<OrderItem> items) {
        return items.stream()
                .map(i -> new OrderItemEventDto(
                        i.getProductId().toString(),
                        i.getQuantity()
                ))
                .toList();
    }
}
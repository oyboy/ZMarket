package com.scammers.orderservice.enums;

public enum OrderStatus {
    CREATED,      // создан, не оплачен
    PENDING_PAYMENT, //ожидает оплаты
    PAID,         // оплачен
    CONFIRMED,    // продавец подтвердил
    SHIPPED,      // отправлен
    IN_DELIVERY,  // в пути
    DELIVERED,    // доставлен
    COMPLETED,    // завершён (отзыв оставлен)
    CANCELLED,    // отменён
    REFUNDED      // возврат
}
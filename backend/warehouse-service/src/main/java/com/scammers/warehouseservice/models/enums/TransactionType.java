package com.scammers.warehouseservice.models.enums;

public enum TransactionType {
    INBOUND, // Поставка
    OUTBOUND, // Ручное списание
    RESERVE, // Резерв под заказ
    COMMIT,  // Списание
    RELEASE, // Отмена резерва
    ADJUSTMENT // Корректировка (брак, инвентаризация)
}
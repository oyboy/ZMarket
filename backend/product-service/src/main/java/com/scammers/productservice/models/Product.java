package com.scammers.productservice.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class Product {
    private Long id;
    private UUID productUUID;
    private UUID sellerId;
    private String title;
    private String description;
    private Double price;
    private Long stock;
    private Double rating;
}

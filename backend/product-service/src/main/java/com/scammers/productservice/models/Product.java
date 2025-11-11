package com.scammers.productservice.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Product implements Serializable {
    private Long id;
    private UUID productUUID;
    private UUID sellerId;
    private String title;
    private String description;
    private Double price;
    private Long stock;
    private Double rating;
}

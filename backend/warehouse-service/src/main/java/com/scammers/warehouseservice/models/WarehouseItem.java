package com.scammers.warehouseservice.models;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class WarehouseItem {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private UUID productId;

    @Column(nullable = false)
    private Integer quantityOnHand = 0;

    @Column(nullable = false)
    private Integer quantityReserved = 0;

    public int getAvailable() {
        return quantityOnHand - quantityReserved;
    }
}

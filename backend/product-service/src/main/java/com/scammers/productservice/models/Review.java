package com.scammers.productservice.models;

import com.scammers.productservice.models.enums.ReviewStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Review {
    private Long id;
    private UUID userUUID;
    private UUID productUUID;
    private short rating;
    private Instant createdAt;
    private Instant updatedAt;
    private String comment;
    private ReviewStatus reviewStatus = ReviewStatus.PUBLISHED;
}

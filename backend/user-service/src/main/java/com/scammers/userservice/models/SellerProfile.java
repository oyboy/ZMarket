package com.scammers.userservice.models;

import com.scammers.userservice.models.enums.VerificationStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "seller_profile")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(onlyExplicitlyIncluded = true)
public class SellerProfile {
    @Id
    @GeneratedValue
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @EqualsAndHashCode.Include
    private User user;

    @NotBlank
    @Column(nullable = false)
    private String companyName;

    @Pattern(regexp = "\\d{10}|\\d{12}")
    @Column(nullable = false, unique = true)
    private String inn;

    private String description;

    @Column(nullable = false)
    private int rating = 0;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private VerificationStatus status;

    private UUID verifiedBy;

    @CreationTimestamp
    private LocalDateTime verifiedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public BigDecimal getRatingAsDecimal() {
        return BigDecimal.valueOf(rating, 2);
    }

    private String avatarUrl;
}
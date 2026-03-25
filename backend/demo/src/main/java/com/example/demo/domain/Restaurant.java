package com.example.demo.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "restaurants")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    /**
     * POI mà nhà hàng này sở hữu.
     */
    @OneToOne(fetch = FetchType.LAZY, mappedBy = "restaurant")
    POI poi;

    @Column(nullable = false)
    String ownerName;

    @Column
    String ownerEmail;

    @Column(length = 20)
    String ownerPhone;

    // === PayOS Integration ===
    @Column
    String payosClientId;

    @Column
    String payosApiKey;

    @Column
    String payosChecksumKey;

    // === Bank Info ===
    @Column
    String bankAccount;

    @Column
    String bankName;

    /**
     * % hoa hồng cho nền tảng (VD: 0.1 = 10%).
     */
    @Column(columnDefinition = "DECIMAL(5,2)")
    @Builder.Default
    Float commissionRate = 0.05f;

    /**
     * Nhà hàng đã được xác minh bởi admin chưa.
     */
    @Column
    @Builder.Default
    Boolean isVerified = false;

    @Column
    @Builder.Default
    Instant createdAt = Instant.now();

    @Column
    Instant updatedAt;
}

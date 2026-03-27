package com.example.demo.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "payments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Payment {

    public enum PaymentStatus {
        PENDING, SUCCESS, FAILED, REFUNDED, CANCELLED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    /**
     * Người thanh toán: deviceId (nếu chưa login) hoặc userId.
     */
    @Column(nullable = false, length = 100)
    String userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "poi_id")
    POI poi;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id")
    Restaurant restaurant;

    /**
     * Số tiền (VND).
     */
    @Column(nullable = false)
    Long amount;

    /**
     * Số suất / số lượng món (gửi PayOS: quantity × unitPrice = amount).
     */
    @Column(nullable = false)
    @Builder.Default
    Integer quantity = 1;

    @Column(length = 10)
    @Builder.Default
    String currency = "VND";

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    PaymentStatus status = PaymentStatus.PENDING;

    /**
     * ID giao dịch từ PayOS.
     */
    @Column(unique = true)
    String payosTransactionId;

    @Column
    String payosPaymentLinkId;

    @Column
    String payosPaymentLink;

    /**
     * Mã QR PayOS để user quét.
     */
    @Column(columnDefinition = "TEXT")
    String payosQrCode;

    /**
     * Thời điểm thanh toán thành công.
     */
    Instant paidAt;

    @Column(nullable = false)
    @Builder.Default
    Instant createdAt = Instant.now();

    @Column
    Instant updatedAt;

    /**
     * Mô tả thanh toán.
     */
    @Column(columnDefinition = "TEXT")
    String description;

    /**
     * Đánh dấu thanh toán thành công.
     */
    public void markSuccess(String transactionId) {
        this.status = PaymentStatus.SUCCESS;
        this.payosTransactionId = transactionId;
        this.paidAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void markFailed() {
        this.status = PaymentStatus.FAILED;
        this.updatedAt = Instant.now();
    }

    public void markCancelled() {
        this.status = PaymentStatus.CANCELLED;
        this.updatedAt = Instant.now();
    }
}

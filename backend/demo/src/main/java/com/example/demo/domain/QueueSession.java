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
@Table(name = "queue_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QueueSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false, length = 100)
    String deviceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "poi_id", nullable = false)
    POI poi;

    /**
     * Thời điểm user bước vào bán kính POI.
     */
    @Column(nullable = false)
    Instant enteredAt;

    /**
     * Thời điểm user rời khỏi bán kính.
     */
    @Column
    Instant exitedAt;

    /**
     * Tổng thời gian nghe trong session này (giây).
     */
    @Builder.Default
    Long totalListeningTime = 0L;

    /**
     * Số audio đã nghe trong session.
     */
    @Builder.Default
    Integer audioCount = 0;

    /**
     * Session này đã thanh toán chưa.
     */
    @Builder.Default
    Boolean isPaid = false;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id")
    Payment payment;

    @Column(nullable = false)
    @Builder.Default
    Instant createdAt = Instant.now();

    /**
     * Tính thời gian đã ở trong session (giây).
     */
    public long getDurationSeconds() {
        Instant end = exitedAt != null ? exitedAt : Instant.now();
        return end.getEpochSecond() - enteredAt.getEpochSecond();
    }

    /**
     * Kết thúc session.
     */
    public void exit() {
        this.exitedAt = Instant.now();
        this.totalListeningTime = getDurationSeconds();
    }
}

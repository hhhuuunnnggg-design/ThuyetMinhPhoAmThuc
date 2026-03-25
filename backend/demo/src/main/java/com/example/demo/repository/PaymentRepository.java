package com.example.demo.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.domain.Payment;
import com.example.demo.domain.Payment.PaymentStatus;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Page<Payment> findByStatus(PaymentStatus status, Pageable pageable);

    Page<Payment> findByUserId(String userId, Pageable pageable);

    Page<Payment> findByRestaurantId(Long restaurantId, Pageable pageable);

    Optional<Payment> findByPayosTransactionId(String transactionId);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = 'SUCCESS' AND p.createdAt >= :since")
    Long sumRevenueToday(@Param("since") Instant since);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = 'SUCCESS' AND p.restaurant.id = :restaurantId AND p.createdAt >= :since")
    Long sumRevenueByRestaurantToday(@Param("restaurantId") Long restaurantId, @Param("since") Instant since);

    List<Payment> findByPoiId(Long poiId);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.status = :status AND p.createdAt >= :since")
    long countByStatusToday(@Param("status") PaymentStatus status, @Param("since") Instant since);
}

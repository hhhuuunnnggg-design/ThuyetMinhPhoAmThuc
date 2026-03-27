package com.example.demo.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.domain.Payment;
import com.example.demo.domain.Payment.PaymentStatus;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long>, JpaSpecificationExecutor<Payment> {

    @EntityGraph(attributePaths = { "poi", "restaurant" })
    Page<Payment> findAll(Specification<Payment> spec, Pageable pageable);

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

    @Query("SELECT p FROM Payment p WHERE p.id = :id")
    @EntityGraph(attributePaths = { "poi", "restaurant" })
    java.util.Optional<Payment> findByIdWithGraph(@Param("id") Long id);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'SUCCESS' AND p.paidAt IS NOT NULL AND p.paidAt >= :start AND p.paidAt < :end")
    Long sumPaidAmountBetween(@Param("start") Instant start, @Param("end") Instant end);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.status = 'SUCCESS' AND p.paidAt IS NOT NULL AND p.paidAt >= :start AND p.paidAt < :end")
    long countPaidBetween(@Param("start") Instant start, @Param("end") Instant end);

    @Query("SELECT p.status, COUNT(p) FROM Payment p WHERE p.createdAt >= :start AND p.createdAt < :end GROUP BY p.status")
    java.util.List<Object[]> countGroupedByStatusBetween(@Param("start") Instant start, @Param("end") Instant end);

    @Query("SELECT p FROM Payment p WHERE p.status = 'SUCCESS' AND p.paidAt IS NOT NULL AND p.paidAt >= :start AND p.paidAt < :end")
    java.util.List<Payment> findPaidSuccessBetween(@Param("start") Instant start, @Param("end") Instant end);
}

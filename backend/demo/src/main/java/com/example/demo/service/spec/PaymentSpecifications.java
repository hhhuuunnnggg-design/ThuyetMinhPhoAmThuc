package com.example.demo.service.spec;

import java.util.Locale;

import org.springframework.data.jpa.domain.Specification;

import com.example.demo.domain.POI;
import com.example.demo.domain.Payment;
import com.example.demo.domain.Payment.PaymentStatus;
import com.example.demo.domain.Restaurant;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;

public final class PaymentSpecifications {

    private PaymentSpecifications() {
    }

    public static Specification<Payment> poiNameContains(String q) {
        if (q == null || q.isBlank()) {
            return (root, query, cb) -> cb.conjunction();
        }
        String pattern = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
        return (root, query, cb) -> {
            Join<Payment, POI> poi = root.join("poi", JoinType.LEFT);
            return cb.like(cb.lower(poi.get("foodName")), pattern);
        };
    }

    public static Specification<Payment> userIdContains(String q) {
        if (q == null || q.isBlank()) {
            return (root, query, cb) -> cb.conjunction();
        }
        String pattern = "%" + q.trim() + "%";
        return (root, query, cb) -> cb.like(root.get("userId"), pattern);
    }

    public static Specification<Payment> statusEquals(PaymentStatus status) {
        if (status == null) {
            return (root, query, cb) -> cb.conjunction();
        }
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Payment> restaurantIdEquals(Long restaurantId) {
        if (restaurantId == null) {
            return (root, query, cb) -> cb.conjunction();
        }
        return (root, query, cb) -> {
            Join<Payment, Restaurant> r = root.join("restaurant", JoinType.LEFT);
            return cb.equal(r.get("id"), restaurantId);
        };
    }
}

package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.domain.POI;

@Repository
public interface POIRepository extends JpaRepository<POI, Long> {

    @EntityGraph(attributePaths = { "user", "restaurant" })
    @Query("SELECT p FROM POI p")
    Page<POI> findPageForAdmin(Pageable pageable);

    /** Danh sách POI do một user tạo — dùng cho SHOP_OWNER. */
    @EntityGraph(attributePaths = { "user", "restaurant" })
    @Query("SELECT p FROM POI p WHERE p.user.id = :userId")
    Page<POI> findPageForAdminByOwnerUserId(@Param("userId") Long userId, Pageable pageable);

    @EntityGraph(attributePaths = { "user", "restaurant" })
    @Query("SELECT p FROM POI p WHERE p.id = :id")
    Optional<POI> findDetailForAdmin(@Param("id") Long id);

    Optional<POI> findByUserId(Long userId);

    Optional<POI> findByQrCode(String qrCode);

    Page<POI> findByIsActiveTrue(Pageable pageable);

    // GPS nằm ở POI, không còn ở group nữa
    @Query("SELECT p FROM POI p WHERE p.isActive = true AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL")
    Page<POI> findAllActiveWithLocation(Pageable pageable);

    @Query("SELECT p FROM POI p WHERE p.isActive = true AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL " +
           "AND (6371 * acos(cos(radians(:lat)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(p.latitude)))) <= :radiusKm")
    List<POI> findNearby(@Param("lat") double lat, @Param("lng") double lng, @Param("radiusKm") double radiusKm);

    List<POI> findByRestaurantId(Long restaurantId);
}

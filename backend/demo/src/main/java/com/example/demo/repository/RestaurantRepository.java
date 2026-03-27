package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.domain.Restaurant;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    Optional<Restaurant> findByOwnerEmail(String email);

    Optional<Restaurant> findByPoiId(Long poiId);

    @EntityGraph(attributePaths = { "poi", "poi.user" })
    @Query("SELECT r FROM Restaurant r WHERE r.id = :id")
    Optional<Restaurant> findByIdWithPoiAndUser(@Param("id") Long id);

    /** SHOP_OWNER: nhà hàng có POI do user tạo, hoặc {@code ownerEmail} trùng email JWT. */
    @EntityGraph(attributePaths = { "poi", "poi.user" })
    @Query(value = "SELECT DISTINCT r FROM Restaurant r LEFT JOIN r.poi p "
            + "WHERE (:uid IS NOT NULL AND p.user.id = :uid) OR "
            + "(:em <> '' AND LOWER(TRIM(COALESCE(r.ownerEmail,''))) = :em)",
            countQuery = "SELECT COUNT(DISTINCT r) FROM Restaurant r LEFT JOIN r.poi p "
                    + "WHERE (:uid IS NOT NULL AND p.user.id = :uid) OR "
                    + "(:em <> '' AND LOWER(TRIM(COALESCE(r.ownerEmail,''))) = :em)")
    Page<Restaurant> findPageForShopOwner(@Param("uid") Long uid, @Param("em") String em, Pageable pageable);
}

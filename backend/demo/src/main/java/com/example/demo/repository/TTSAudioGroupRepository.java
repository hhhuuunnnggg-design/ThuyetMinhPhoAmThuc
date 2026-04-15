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

import com.example.demo.domain.TTSAudioGroup;

@Repository
public interface TTSAudioGroupRepository extends JpaRepository<TTSAudioGroup, Long> {
    @EntityGraph(attributePaths = { "poi", "poi.user" })
    Optional<TTSAudioGroup> findByGroupKey(String groupKey);

    @EntityGraph(attributePaths = { "poi", "poi.user" })
    Optional<TTSAudioGroup> findById(Long id);

    /** Rõ ràng theo khóa ngoại POI — tránh sai lệch khi Spring parse tên method derived.
     *  ORDER BY g.id ASC để primaryGroup = groups.get(0) luôn là group cũ nhất (ổn định). */
    @Query("SELECT g FROM TTSAudioGroup g WHERE g.poi.id = :poiId ORDER BY g.id ASC")
    List<TTSAudioGroup> findByPoiId(@Param("poiId") Long poiId);

    List<TTSAudioGroup> findByFoodNameContainingIgnoreCase(String foodName);

    @EntityGraph(attributePaths = { "poi", "poi.user" })
    @Query("SELECT g FROM TTSAudioGroup g ORDER BY g.createdAt DESC")
    Page<TTSAudioGroup> findAllOrderByCreatedAtDesc(Pageable pageable);

    @EntityGraph(attributePaths = { "poi", "poi.user" })
    @Query(value = "SELECT g FROM TTSAudioGroup g JOIN g.poi p WHERE p.user.id = :userId ORDER BY g.createdAt DESC",
            countQuery = "SELECT COUNT(g) FROM TTSAudioGroup g JOIN g.poi p WHERE p.user.id = :userId")
    Page<TTSAudioGroup> findPageByPoiOwnerUserId(@Param("userId") Long userId, Pageable pageable);
}

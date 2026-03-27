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
    @EntityGraph(attributePaths = { "poi" })
    Optional<TTSAudioGroup> findByGroupKey(String groupKey);

    @EntityGraph(attributePaths = { "poi" })
    Optional<TTSAudioGroup> findById(Long id);

    /** Rõ ràng theo khóa ngoại POI — tránh sai lệch khi Spring parse tên method derived. */
    @Query("SELECT g FROM TTSAudioGroup g WHERE g.poi.id = :poiId")
    List<TTSAudioGroup> findByPoiId(@Param("poiId") Long poiId);

    List<TTSAudioGroup> findByFoodNameContainingIgnoreCase(String foodName);

    @EntityGraph(attributePaths = { "poi" })
    @Query("SELECT g FROM TTSAudioGroup g ORDER BY g.createdAt DESC")
    Page<TTSAudioGroup> findAllOrderByCreatedAtDesc(Pageable pageable);
}

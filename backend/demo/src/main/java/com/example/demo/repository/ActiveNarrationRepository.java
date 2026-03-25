package com.example.demo.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.domain.ActiveNarration;
import com.example.demo.domain.ActiveNarration.NarrationStatus;

@Repository
public interface ActiveNarrationRepository extends JpaRepository<ActiveNarration, Long> {

    List<ActiveNarration> findByStatus(NarrationStatus status);

    Optional<ActiveNarration> findByDeviceIdAndStatus(String deviceId, NarrationStatus status);

    List<ActiveNarration> findByPoiIdAndStatus(Long poiId, NarrationStatus status);

    @Query("SELECT COUNT(a) FROM ActiveNarration a WHERE a.status = 'PLAYING'")
    long countCurrentlyPlaying();

    @Query("SELECT COUNT(a) FROM ActiveNarration a WHERE a.poi.id = :poiId AND a.status = 'PLAYING'")
    long countPlayingByPoi(@Param("poiId") Long poiId);

    @Query("SELECT a.poi.id, COUNT(a) FROM ActiveNarration a WHERE a.status = 'PLAYING' GROUP BY a.poi.id")
    List<Object[]> countPlayingByPoi();

    @Query("SELECT a FROM ActiveNarration a WHERE a.status = 'PLAYING' AND a.estimatedEndAt < :now")
    List<ActiveNarration> findExpiredPlaying(@Param("now") Instant now);

    List<ActiveNarration> findByDeviceId(String deviceId);

    @Query("SELECT COUNT(a) FROM ActiveNarration a WHERE a.status = 'PLAYING' AND a.poi.id = :poiId")
    int getActiveCountByPoiId(@Param("poiId") Long poiId);
}

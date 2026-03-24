package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.demo.domain.TTSAudioGroup;

@Repository
public interface TTSAudioGroupRepository extends JpaRepository<TTSAudioGroup, Long> {
    Optional<TTSAudioGroup> findByGroupKey(String groupKey);

    List<TTSAudioGroup> findByFoodNameContainingIgnoreCase(String foodName);

    @Query("SELECT g FROM TTSAudioGroup g ORDER BY g.createdAt DESC")
    Page<TTSAudioGroup> findAllOrderByCreatedAtDesc(Pageable pageable);
}

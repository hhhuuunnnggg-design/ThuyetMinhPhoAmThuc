package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.domain.TTSAudio;

@Repository
public interface TTSAudioRepository extends JpaRepository<TTSAudio, Long>, JpaSpecificationExecutor<TTSAudio> {

    List<TTSAudio> findAllByOrderByCreatedAtDesc();

    Optional<TTSAudio> findByGroupIdAndLanguageCode(Long groupId, String languageCode);

    List<TTSAudio> findByGroup_Id(Long groupId);

    @EntityGraph(attributePaths = { "group", "group.poi", "group.poi.user" })
    @Query("SELECT a FROM TTSAudio a WHERE a.id = :id")
    Optional<TTSAudio> findByIdWithGroupPoiUser(@Param("id") Long id);

    @EntityGraph(attributePaths = { "group", "group.poi", "group.poi.user" })
    @Query(value = "SELECT a FROM TTSAudio a JOIN a.group g JOIN g.poi p WHERE p.user.id = :userId ORDER BY a.createdAt DESC",
            countQuery = "SELECT COUNT(a) FROM TTSAudio a JOIN a.group g JOIN g.poi p WHERE p.user.id = :userId")
    Page<TTSAudio> findPageByPoiOwnerUserId(@Param("userId") Long userId, Pageable pageable);
}

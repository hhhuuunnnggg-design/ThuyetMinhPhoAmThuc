package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.example.demo.domain.TTSAudio;

@Repository
public interface TTSAudioRepository extends JpaRepository<TTSAudio, Long>, JpaSpecificationExecutor<TTSAudio> {

    List<TTSAudio> findAllByOrderByCreatedAtDesc();

    Optional<TTSAudio> findByGroupIdAndLanguageCode(Long groupId, String languageCode);
}

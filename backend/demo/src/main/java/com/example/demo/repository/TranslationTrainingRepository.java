package com.example.demo.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.domain.TranslationTraining;
import com.example.demo.domain.TranslationTraining.DataSource;

@Repository
public interface TranslationTrainingRepository extends JpaRepository<TranslationTraining, Long> {

    Page<TranslationTraining> findBySourceLangAndTargetLang(String sourceLang, String targetLang, Pageable pageable);

    Page<TranslationTraining> findByIsValidatedFalse(Pageable pageable);

    List<TranslationTraining> findBySource(DataSource source);

    @Query("SELECT COUNT(t) FROM TranslationTraining t WHERE t.isValidated = true")
    long countValidated();

    @Query("SELECT COUNT(t) FROM TranslationTraining t WHERE t.isValidated = false")
    long countPending();

    @Query("SELECT AVG(t.confidence) FROM TranslationTraining t WHERE t.sourceLang = :lang AND t.confidence IS NOT NULL")
    Float avgConfidenceByLang(@Param("lang") String lang);

    @Query("SELECT t.sourceLang, t.targetLang, COUNT(t), AVG(t.confidence) FROM TranslationTraining t GROUP BY t.sourceLang, t.targetLang")
    List<Object[]> statsByLanguagePair();
}

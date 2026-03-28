package com.example.demo.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Entity
// @Table(name = "translation_training")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TranslationTraining {

    public enum DataSource {
        MANUAL,       // Admin nhập tay
        CORPUS,       // Upload bilingual corpus
        USER_FEEDBACK // Phản hồi từ user
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(length = 10)
    String sourceLang;

    @Column(length = 10)
    String targetLang;

    /**
     * Text gốc (tiếng Việt).
     */
    @Column(columnDefinition = "TEXT", nullable = false)
    String sourceText;

    /**
     * Text đã dịch (model sinh ra).
     */
    @Column(columnDefinition = "TEXT")
    String targetText;

    /**
     * Độ tự tin của model (0.0 - 1.0).
     */
    Float confidence;

    /**
     * Đã được human verify chưa.
     */
    @Column
    @Builder.Default
    Boolean isValidated = false;

    /**
     * Text đã được human correct (nếu model sai).
     */
    @Column(columnDefinition = "TEXT")
    String correctedText;

    /**
     * Nguồn dữ liệu.
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    DataSource source = DataSource.MANUAL;

    @Column
    @Builder.Default
    Instant trainedAt = Instant.now();

    /**
     * Admin/người dùng validate dữ liệu.
     */
    @Column
    String validatedBy;

    @Column
    Instant validatedAt;

    /**
     * Đánh dấu là đã validate, lưu corrected text nếu có.
     */
    public void validate(String corrected, String validatedBy) {
        this.isValidated = true;
        if (corrected != null && !corrected.isBlank()) {
            this.correctedText = corrected;
        }
        this.validatedBy = validatedBy;
        this.validatedAt = Instant.now();
    }
}

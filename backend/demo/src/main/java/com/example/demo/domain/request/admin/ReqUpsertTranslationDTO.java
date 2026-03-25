package com.example.demo.domain.request.admin;

import com.example.demo.domain.TranslationTraining.DataSource;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReqUpsertTranslationDTO {

    @NotBlank(message = "sourceLang không được để trống")
    String sourceLang;

    @NotBlank(message = "targetLang không được để trống")
    String targetLang;

    @NotBlank(message = "sourceText không được để trống")
    String sourceText;

    @NotBlank(message = "targetText không được để trống")
    String targetText;

    Float confidence;

    DataSource source;

    String correctedText;
}

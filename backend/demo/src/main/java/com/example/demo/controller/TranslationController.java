package com.example.demo.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.TranslationTraining;
import com.example.demo.domain.request.admin.ReqUpsertTranslationDTO;
import com.example.demo.repository.TranslationTrainingRepository;
import com.example.demo.util.annotation.ApiMessage;
import com.example.demo.util.error.IdInvalidException;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/admin/translation")
public class TranslationController {

    private final TranslationTrainingRepository repository;

    public TranslationController(TranslationTrainingRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/corpus")
    @ApiMessage("Danh sách training data")
    public ResponseEntity<Page<TranslationTraining>> getCorpus(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sourceLang,
            @RequestParam(required = false) String targetLang) {

        Pageable pageable = PageRequest.of(page, size);
        Page<TranslationTraining> result;

        if (sourceLang != null && targetLang != null) {
            result = repository.findBySourceLangAndTargetLang(sourceLang, targetLang, pageable);
        } else {
            result = repository.findAll(pageable);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/pending")
    @ApiMessage("Dữ liệu chưa validate")
    public ResponseEntity<Page<TranslationTraining>> getPending(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(repository.findByIsValidatedFalse(PageRequest.of(page, size)));
    }

    @PostMapping("/corpus")
    @ApiMessage("Thêm training data")
    public ResponseEntity<TranslationTraining> addCorpus(@Valid @RequestBody ReqUpsertTranslationDTO req) {
        TranslationTraining training = TranslationTraining.builder()
                .sourceLang(req.getSourceLang())
                .targetLang(req.getTargetLang())
                .sourceText(req.getSourceText())
                .targetText(req.getTargetText())
                .confidence(req.getConfidence())
                .source(req.getSource())
                .correctedText(req.getCorrectedText())
                .isValidated(false)
                .trainedAt(java.time.Instant.now())
                .build();

        training = repository.save(training);
        return ResponseEntity.ok(training);
    }

    @PostMapping("/corpus/bulk")
    @ApiMessage("Thêm nhiều training data cùng lúc")
    public ResponseEntity<List<TranslationTraining>> addBulkCorpus(
            @RequestBody List<ReqUpsertTranslationDTO> requests) {
        List<TranslationTraining> trainings = requests.stream().map(req ->
                TranslationTraining.builder()
                        .sourceLang(req.getSourceLang())
                        .targetLang(req.getTargetLang())
                        .sourceText(req.getSourceText())
                        .targetText(req.getTargetText())
                        .confidence(req.getConfidence())
                        .source(req.getSource())
                        .isValidated(false)
                        .trainedAt(java.time.Instant.now())
                        .build()
        ).collect(Collectors.toList());

        List<TranslationTraining> saved = repository.saveAll(trainings);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/validate/{id}")
    @ApiMessage("Validate/Correct translation")
    public ResponseEntity<TranslationTraining> validateTranslation(
            @PathVariable Long id,
            @RequestBody ValidateRequest req) throws IdInvalidException {

        TranslationTraining training = repository.findById(id)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy translation: " + id));

        training.validate(req.getCorrectedText(), req.getValidatedBy());
        training = repository.save(training);
        return ResponseEntity.ok(training);
    }

    @DeleteMapping("/corpus/{id}")
    @ApiMessage("Xóa training data")
    public ResponseEntity<Void> deleteCorpus(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @lombok.Data
    public static class ValidateRequest {
        String correctedText;
        String validatedBy;
    }
}

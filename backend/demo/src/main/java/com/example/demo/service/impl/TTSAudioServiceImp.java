package com.example.demo.service.impl;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.domain.TTSAudio;
import com.example.demo.domain.TTSAudioGroup;
import com.example.demo.domain.dto.SupportedLanguage;
import com.example.demo.domain.request.tts.ReqTTSDTO;
import com.example.demo.domain.response.tts.ResMultilingualAudioDTO;
import com.example.demo.domain.response.tts.ResTTSAudioDTO;
import com.example.demo.domain.response.tts.ResTTSAudioGroupDTO;
import com.example.demo.repository.TTSAudioGroupRepository;
import com.example.demo.repository.TTSAudioRepository;
import com.example.demo.service.GoogleCloudTTSService;
import com.example.demo.service.LocalStorageService;
import com.example.demo.service.TTSAudioService;
import com.example.demo.service.TranslationService;
import com.example.demo.util.error.IdInvalidException;

@Service
public class TTSAudioServiceImp implements TTSAudioService {

    @Autowired
    private TTSAudioRepository ttsAudioRepository;

    @Autowired
    private TTSAudioGroupRepository ttsAudioGroupRepository;

    @Autowired
    private LocalStorageService localStorageService;

    @Autowired(required = false)
    private GoogleCloudTTSService googleCloudTTSService;

    @Autowired(required = false)
    private TranslationService translationService;

    @Override
    @Transactional
    public TTSAudio createTTSAudio(ReqTTSDTO request, byte[] audioData, String fileName, String createdBy)
            throws IOException {
        String contentType = request.getTtsReturnOption() == 2 ? "audio/wav" : "audio/mpeg";
        String s3Url = null;

        // Lưu file vào local storage
        try {
            s3Url = localStorageService.uploadFile(
                    new ByteArrayInputStream(audioData),
                    fileName,
                    contentType,
                    "tts-audios");

            System.out.println("========================================");
            System.out.println("✅ LƯU FILE THÀNH CÔNG!");
            System.out.println("📂 Folder: tts-audios");
            System.out.println("📄 File Name: " + fileName);
            System.out.println("🔗 URL: " + s3Url);
            System.out.println("========================================");
        } catch (Exception e) {
            System.err.println("========================================");
            System.err.println("❌ LƯU FILE THẤT BẠI!");
            System.err.println("📂 Folder: tts-audios");
            System.err.println("📄 File Name: " + fileName);
            System.err.println("⚠️  Lỗi: " + e.getMessage());
            System.err.println("========================================");
        }

        // Tạo entity
        TTSAudio ttsAudio = TTSAudio.builder()
                .text(request.getText())
                .voice(request.getVoice())
                .speed(request.getSpeed())
                .format(request.getTtsReturnOption())
                .withoutFilter(request.getWithoutFilter())
                .fileName("tts-audios/" + fileName)
                .s3Url(s3Url)
                .fileSize((long) audioData.length)
                .mimeType(contentType)
                .createdAt(Instant.now())
                .createdBy(createdBy)
                // Thông tin thuyết minh ẩm thực
                .foodName(request.getFoodName())
                .price(request.getPrice())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                // Vị trí GPS
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .accuracy(request.getAccuracy())
                // Cấu hình geofence
                .triggerRadiusMeters(request.getTriggerRadiusMeters())
                .priority(request.getPriority())
                .build();

        return ttsAudioRepository.save(ttsAudio);
    }

    @Override
    public TTSAudio getTTSAudioById(Long id) throws IdInvalidException {
        return ttsAudioRepository.findById(id)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy TTS audio với id: " + id));
    }

    @Override
    public Page<ResTTSAudioDTO> getAllTTSAudios(Specification<TTSAudio> spec, Pageable pageable) {
        Page<TTSAudio> ttsAudios = ttsAudioRepository.findAll(spec, pageable);
        return ttsAudios.map(this::convertToDTO);
    }

    @Override
    public List<ResTTSAudioDTO> getTTSAudiosByUser(String createdBy) {
        List<TTSAudio> ttsAudios = ttsAudioRepository.findByCreatedByOrderByCreatedAtDesc(createdBy);
        return ttsAudios.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteTTSAudio(Long id) throws IOException, IdInvalidException {
        TTSAudio ttsAudio = getTTSAudioById(id);
        try {
            // Xóa file nếu có
            if (ttsAudio.getS3Url() != null) {
                try {
                    localStorageService.deleteFile(ttsAudio.getFileName());
                } catch (Exception e) {
                    System.err.println("WARNING: Không thể xóa file: " + e.getMessage());
                }
            }
            // Xóa record trong DB
            ttsAudioRepository.delete(ttsAudio);
        } catch (Exception e) {
            throw new IOException("Lỗi khi xóa TTS audio: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public TTSAudio updateTTSAudio(Long id, ReqTTSDTO request) throws IOException, IdInvalidException {
        TTSAudio ttsAudio = getTTSAudioById(id);

        // Cập nhật metadata (không regenerate audio)
        ttsAudio.setText(request.getText());
        ttsAudio.setVoice(request.getVoice());
        ttsAudio.setSpeed(request.getSpeed());
        ttsAudio.setFormat(request.getTtsReturnOption());
        ttsAudio.setWithoutFilter(request.getWithoutFilter());
        // Thông tin ẩm thực
        ttsAudio.setFoodName(request.getFoodName());
        ttsAudio.setPrice(request.getPrice());
        ttsAudio.setDescription(request.getDescription());
        ttsAudio.setImageUrl(request.getImageUrl());
        // GPS
        ttsAudio.setLatitude(request.getLatitude());
        ttsAudio.setLongitude(request.getLongitude());
        ttsAudio.setAccuracy(request.getAccuracy());
        // Geofence
        ttsAudio.setTriggerRadiusMeters(request.getTriggerRadiusMeters());
        ttsAudio.setPriority(request.getPriority());
        ttsAudio.setUpdatedAt(Instant.now());

        return ttsAudioRepository.save(ttsAudio);
    }

    @Override
    @Transactional
    public TTSAudio updateTTSAudioWithNewFile(Long id, ReqTTSDTO request, byte[] audioData, String fileName)
            throws IOException, IdInvalidException {
        TTSAudio ttsAudio = getTTSAudioById(id);
        String contentType = request.getTtsReturnOption() == 2 ? "audio/wav" : "audio/mpeg";
        String s3Url = null;

        // Lưu file mới vào local storage
        try {
            s3Url = localStorageService.uploadFile(
                    new ByteArrayInputStream(audioData),
                    fileName,
                    contentType,
                    "tts-audios");

            System.out.println("✅ Đã lưu file mới: " + s3Url);
        } catch (Exception e) {
            System.err.println("⚠️  Không thể lưu file mới: " + e.getMessage());
        }

        // Cập nhật metadata và file info
        ttsAudio.setText(request.getText());
        ttsAudio.setVoice(request.getVoice());
        ttsAudio.setSpeed(request.getSpeed());
        ttsAudio.setFormat(request.getTtsReturnOption());
        ttsAudio.setWithoutFilter(request.getWithoutFilter());
        ttsAudio.setFileName("tts-audios/" + fileName);
        ttsAudio.setS3Url(s3Url);
        ttsAudio.setFileSize((long) audioData.length);
        ttsAudio.setMimeType(contentType);
        // Thông tin ẩm thực
        ttsAudio.setFoodName(request.getFoodName());
        ttsAudio.setPrice(request.getPrice());
        ttsAudio.setDescription(request.getDescription());
        ttsAudio.setImageUrl(request.getImageUrl());
        // GPS
        ttsAudio.setLatitude(request.getLatitude());
        ttsAudio.setLongitude(request.getLongitude());
        ttsAudio.setAccuracy(request.getAccuracy());
        // Geofence
        ttsAudio.setTriggerRadiusMeters(request.getTriggerRadiusMeters());
        ttsAudio.setPriority(request.getPriority());
        ttsAudio.setUpdatedAt(Instant.now());

        return ttsAudioRepository.save(ttsAudio);
    }

    @Override
    public void deleteTTSAudioFileFromS3(String fileName) throws IOException {
        if (fileName != null) {
            try {
                localStorageService.deleteFile(fileName);
            } catch (Exception e) {
                throw new IOException("Không thể xóa file: " + e.getMessage(), e);
            }
        }
    }

    @Override
    public Resource getAudioResourceFromS3(String fileName) throws IOException {
        try {
            InputStream inputStream = localStorageService.getFileInputStream(fileName);
            return new InputStreamResource(inputStream);
        } catch (Exception e) {
            throw new IOException("Không thể lấy file: " + e.getMessage(), e);
        }
    }

    @Override
    public Resource getImageResourceFromS3(String fileName) throws IOException {
        try {
            InputStream inputStream = localStorageService.getFileInputStream(fileName);
            return new InputStreamResource(inputStream);
        } catch (Exception e) {
            throw new IOException("Không thể lấy ảnh: " + e.getMessage(), e);
        }
    }

    private ResTTSAudioDTO convertToDTO(TTSAudio ttsAudio) {
        return ResTTSAudioDTO.builder()
                .id(ttsAudio.getId())
                .text(ttsAudio.getText())
                .voice(ttsAudio.getVoice())
                .speed(ttsAudio.getSpeed())
                .format(ttsAudio.getFormat())
                .withoutFilter(ttsAudio.getWithoutFilter())
                .fileName(ttsAudio.getFileName())
                .s3Url(ttsAudio.getS3Url())
                .fileSize(ttsAudio.getFileSize())
                .mimeType(ttsAudio.getMimeType())
                .createdAt(ttsAudio.getCreatedAt())
                .updatedAt(ttsAudio.getUpdatedAt())
                .createdBy(ttsAudio.getCreatedBy())
                .foodName(ttsAudio.getFoodName())
                .price(ttsAudio.getPrice())
                .description(ttsAudio.getDescription())
                .imageUrl(ttsAudio.getImageUrl())
                .latitude(ttsAudio.getLatitude())
                .longitude(ttsAudio.getLongitude())
                .accuracy(ttsAudio.getAccuracy())
                .triggerRadiusMeters(ttsAudio.getTriggerRadiusMeters())
                .priority(ttsAudio.getPriority())
                .languageCode(ttsAudio.getLanguageCode())
                .translatedText(ttsAudio.getTranslatedText())
                .build();
    }

    // ============ Multi-language ============

    @Override
    @Transactional
    public ResMultilingualAudioDTO createMultilingualAudio(ReqTTSDTO request) throws IOException {
        if (googleCloudTTSService == null || translationService == null) {
            throw new IOException("Google Cloud TTS or Translation service is not available");
        }

        String originalText = request.getText();
        String groupKey = UUID.randomUUID().toString();
        String createdBy = request.getCreatedBy() != null ? request.getCreatedBy() : "anonymous";

        // 1. Tạo và save group TRƯỚC (để có ID cho audio references)
        TTSAudioGroup group = TTSAudioGroup.builder()
                .groupKey(groupKey)
                .foodName(request.getFoodName())
                .originalText(originalText)
                .originalVoice(request.getVoice())
                .createdAt(Instant.now())
                .build();
        group = ttsAudioGroupRepository.save(group);

        // 2. Dịch sang 5 ngôn ngữ
        Map<String, String> translations = translationService.translateToMultiple(originalText);

        // 3. Tạo TTS cho từng ngôn ngữ
        List<ResMultilingualAudioDTO.AudioEntry> entries = new ArrayList<>();

        String[] targetLangs = { SupportedLanguage.EN, SupportedLanguage.ZH,
                SupportedLanguage.JA, SupportedLanguage.KO, SupportedLanguage.FR };

        for (String lang : targetLangs) {
            String translatedText = translations.get(lang);
            if (translatedText == null || translatedText.isBlank()) {
                translatedText = "";
            }

            if (!translatedText.isBlank()) {
                byte[] audioData = googleCloudTTSService.synthesize(translatedText, lang, request.getSpeed() != null ? request.getSpeed() : 1.0f);

                String fileName = String.format("tts-audios/%s/%s-%d.mp3",
                        groupKey, lang, System.currentTimeMillis());
                String s3Url = null;

                try {
                    s3Url = localStorageService.uploadFile(
                            new ByteArrayInputStream(audioData),
                            fileName,
                            "audio/mpeg",
                            "");
                } catch (Exception e) {
                    System.err.println("Failed to save audio for " + lang + ": " + e.getMessage());
                }

                TTSAudio audio = TTSAudio.builder()
                        .group(group)
                        .text(translatedText)
                        .voice(SupportedLanguage.getVoice(lang))
                        .speed(request.getSpeed() != null ? request.getSpeed() : 1.0f)
                        .format(3) // mp3
                        .withoutFilter(request.getWithoutFilter() != null ? request.getWithoutFilter() : false)
                        .fileName(fileName)
                        .s3Url(s3Url)
                        .fileSize((long) audioData.length)
                        .mimeType("audio/mpeg")
                        .createdAt(Instant.now())
                        .createdBy(createdBy)
                        .foodName(request.getFoodName())
                        .price(request.getPrice())
                        .description(request.getDescription())
                        .imageUrl(request.getImageUrl())
                        .latitude(request.getLatitude())
                        .longitude(request.getLongitude())
                        .accuracy(request.getAccuracy())
                        .triggerRadiusMeters(request.getTriggerRadiusMeters())
                        .priority(request.getPriority())
                        .languageCode(lang)
                        .translatedText(translatedText)
                        .build();

                audio = ttsAudioRepository.save(audio);

                entries.add(ResMultilingualAudioDTO.AudioEntry.builder()
                        .id(audio.getId())
                        .languageCode(lang)
                        .languageName(SupportedLanguage.getName(lang))
                        .s3Url(s3Url)
                        .fileSize((long) audioData.length)
                        .build());
            }
        }

        return ResMultilingualAudioDTO.builder()
                .groupId(groupKey)
                .audios(entries)
                .build();
    }

    @Override
    public ResTTSAudioGroupDTO getGroupById(Long id) throws IdInvalidException {
        TTSAudioGroup group = ttsAudioGroupRepository.findById(id)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy group với id: " + id));

        return buildGroupDTO(group);
    }

    @Override
    public ResTTSAudioGroupDTO getGroupByKey(String groupKey) throws IdInvalidException {
        TTSAudioGroup group = ttsAudioGroupRepository.findByGroupKey(groupKey)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy group với key: " + groupKey));

        return buildGroupDTO(group);
    }

    @Override
    @Transactional
    public ResMultilingualAudioDTO createMultilingualForExisting(TTSAudio viAudio, ReqTTSDTO request) {
        if (googleCloudTTSService == null || translationService == null) {
            throw new RuntimeException("Google Cloud TTS or Translation service is not available");
        }

        String originalText = request.getText() != null ? request.getText() : viAudio.getText();

        // Lấy group từ audio tiếng Việt, nếu chưa có thì tạo mới
        TTSAudioGroup group = viAudio.getGroup();
        if (group == null) {
            // Tạo group mới và link vào viAudio
            String groupKey = UUID.randomUUID().toString();
            group = TTSAudioGroup.builder()
                    .groupKey(groupKey)
                    .foodName(request.getFoodName() != null ? request.getFoodName() : viAudio.getFoodName())
                    .originalText(originalText)
                    .originalVoice(request.getVoice() != null ? request.getVoice() : viAudio.getVoice())
                    .createdAt(Instant.now())
                    .build();
            group = ttsAudioGroupRepository.save(group);

            // Update viAudio với group mới
            viAudio.setGroup(group);
            viAudio.setLanguageCode(SupportedLanguage.VI);
            viAudio.setTranslatedText(originalText);
            ttsAudioRepository.save(viAudio);
        }

        // Dịch sang 5 ngôn ngữ
        Map<String, String> translations = translationService.translateToMultiple(originalText);

        List<ResMultilingualAudioDTO.AudioEntry> entries = new ArrayList<>();

        // Add Vietnamese audio entry (từ viAudio)
        entries.add(ResMultilingualAudioDTO.AudioEntry.builder()
                .id(viAudio.getId())
                .languageCode(SupportedLanguage.VI)
                .languageName(SupportedLanguage.getName(SupportedLanguage.VI))
                .s3Url(viAudio.getS3Url())
                .fileSize(viAudio.getFileSize())
                .build());

        // Tạo audio cho từng ngôn ngữ
        String[] targetLangs = { SupportedLanguage.EN, SupportedLanguage.ZH,
                SupportedLanguage.JA, SupportedLanguage.KO, SupportedLanguage.FR };

        for (String lang : targetLangs) {
            String translatedText = translations.get(lang);
            if (translatedText == null || translatedText.isBlank()) {
                translatedText = "";
            }

            if (!translatedText.isBlank()) {
                try {
                    byte[] audioData = googleCloudTTSService.synthesize(translatedText, lang,
                            request.getSpeed() != null ? request.getSpeed() : 1.0f);

                    String fileName = String.format("tts-audios/%s/%s-%d.mp3",
                            group.getGroupKey(), lang, System.currentTimeMillis());
                    String audioUrl = localStorageService.uploadFile(
                            new ByteArrayInputStream(audioData),
                            fileName,
                            "audio/mpeg",
                            "");

                    TTSAudio audio = TTSAudio.builder()
                            .group(group)
                            .text(translatedText)
                            .voice(SupportedLanguage.getVoice(lang))
                            .speed(request.getSpeed() != null ? request.getSpeed() : 1.0f)
                            .format(3)
                            .withoutFilter(request.getWithoutFilter() != null ? request.getWithoutFilter() : false)
                            .fileName(fileName)
                            .s3Url(audioUrl)
                            .fileSize((long) audioData.length)
                            .mimeType("audio/mpeg")
                            .createdAt(Instant.now())
                            .createdBy(viAudio.getCreatedBy())
                            .foodName(viAudio.getFoodName())
                            .price(viAudio.getPrice())
                            .description(viAudio.getDescription())
                            .imageUrl(viAudio.getImageUrl())
                            .latitude(viAudio.getLatitude())
                            .longitude(viAudio.getLongitude())
                            .accuracy(viAudio.getAccuracy())
                            .triggerRadiusMeters(viAudio.getTriggerRadiusMeters())
                            .priority(viAudio.getPriority())
                            .languageCode(lang)
                            .translatedText(translatedText)
                            .build();

                    audio = ttsAudioRepository.save(audio);

                    entries.add(ResMultilingualAudioDTO.AudioEntry.builder()
                            .id(audio.getId())
                            .languageCode(lang)
                            .languageName(SupportedLanguage.getName(lang))
                            .s3Url(audioUrl)
                            .fileSize((long) audioData.length)
                            .build());

                    System.out.println("✅ Đã tạo audio " + SupportedLanguage.getName(lang) + ": " + audioUrl);
                } catch (Exception e) {
                    System.err.println("⚠️  Không thể tạo audio " + lang + ": " + e.getMessage());
                }
            }
        }

        return ResMultilingualAudioDTO.builder()
                .groupId(group.getGroupKey())
                .audios(entries)
                .build();
    }

    private ResTTSAudioGroupDTO buildGroupDTO(TTSAudioGroup group) {
        List<ResMultilingualAudioDTO.AudioEntry> entries = new ArrayList<>();

        if (group.getAudios() != null) {
            for (TTSAudio audio : group.getAudios()) {
                entries.add(ResMultilingualAudioDTO.AudioEntry.builder()
                        .id(audio.getId())
                        .languageCode(audio.getLanguageCode())
                        .languageName(SupportedLanguage.getName(audio.getLanguageCode()))
                        .s3Url(audio.getS3Url())
                        .fileSize(audio.getFileSize())
                        .build());
            }
        }

        return ResTTSAudioGroupDTO.builder()
                .id(group.getId())
                .groupKey(group.getGroupKey())
                .foodName(group.getFoodName())
                .originalText(group.getOriginalText())
                .originalVoice(group.getOriginalVoice())
                .createdAt(group.getCreatedAt())
                .audios(entries)
                .build();
    }
}

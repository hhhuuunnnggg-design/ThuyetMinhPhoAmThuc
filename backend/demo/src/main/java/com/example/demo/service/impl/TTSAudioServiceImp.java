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
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.domain.TTSAudio;
import com.example.demo.domain.User;
import com.example.demo.domain.TTSAudioGroup;
import com.example.demo.domain.dto.SupportedLanguage;
import com.example.demo.domain.request.tts.ReqTTSDTO;
import com.example.demo.domain.request.tts.ReqUpdateTTSAudioGroupDTO;
import com.example.demo.domain.response.tts.ResMultilingualAudioDTO;
import com.example.demo.domain.response.tts.ResTTSAudioDTO;
import com.example.demo.domain.response.tts.ResTTSAudioGroupDTO;
import com.example.demo.repository.TTSAudioGroupRepository;
import com.example.demo.repository.TTSAudioRepository;
import com.example.demo.repository.UserServiceRepository;
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
    private UserServiceRepository userServiceRepository;

    @Autowired
    private LocalStorageService localStorageService;

    @Autowired(required = false)
    private GoogleCloudTTSService googleCloudTTSService;

    @Autowired(required = false)
    private TranslationService translationService;

    // ============ CREATE (với Group mới) ============

    @Override
    @Transactional
    public TTSAudio createTTSAudio(ReqTTSDTO request, byte[] audioData, String fileName, String createdBy)
            throws IOException {
        String contentType = request.getTtsReturnOption() == 2 ? "audio/wav" : "audio/mpeg";
        String s3Url = saveAudioFile(audioData, fileName, contentType);

        // Tìm User từ email
        User user = userServiceRepository.findByEmail(createdBy);

        // Tạo Group mới
        TTSAudioGroup group = TTSAudioGroup.builder()
                .groupKey(UUID.randomUUID().toString())
                .foodName(request.getFoodName())
                .price(request.getPrice())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .accuracy(request.getAccuracy())
                .triggerRadiusMeters(request.getTriggerRadiusMeters())
                .priority(request.getPriority())
                .originalText(request.getText())
                .originalVoice(request.getVoice())
                .originalSpeed(request.getSpeed())
                .originalFormat(request.getTtsReturnOption())
                .originalWithoutFilter(request.getWithoutFilter())
                .createdBy(createdBy)
                .user(user)
                .createdAt(Instant.now())
                .build();
        group = ttsAudioGroupRepository.save(group);

        // Tạo TTSAudio (tiếng Việt)
        TTSAudio ttsAudio = TTSAudio.builder()
                .group(group)
                .languageCode(SupportedLanguage.VI)
                .text(request.getText())
                .translatedText(request.getText()) // Tiếng Việt = text gốc
                .voice(request.getVoice())
                .speed(request.getSpeed())
                .format(request.getTtsReturnOption())
                .withoutFilter(request.getWithoutFilter())
                .fileName("tts-audios/" + fileName)
                .s3Url(s3Url)
                .fileSize((long) audioData.length)
                .mimeType(contentType)
                .createdAt(Instant.now())
                .build();

        return ttsAudioRepository.save(ttsAudio);
    }

    // ============ READ ============

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
        List<TTSAudio> ttsAudios = ttsAudioRepository.findByGroup_CreatedByOrderByCreatedAtDesc(createdBy);
        return ttsAudios.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ============ UPDATE ============

    @Override
    @Transactional
    public TTSAudio updateTTSAudio(Long id, ReqTTSDTO request) throws IOException, IdInvalidException {
        TTSAudio ttsAudio = getTTSAudioById(id);
        TTSAudioGroup group = ttsAudio.getGroup();

        // Cập nhật metadata audio
        ttsAudio.setText(request.getText());
        ttsAudio.setVoice(request.getVoice());
        ttsAudio.setSpeed(request.getSpeed());
        ttsAudio.setFormat(request.getTtsReturnOption());
        ttsAudio.setWithoutFilter(request.getWithoutFilter());
        ttsAudio.setUpdatedAt(Instant.now());

        // Cập nhật metadata nhóm (thông tin ẩm thực, GPS, geofence)
        if (group != null) {
            group.setFoodName(request.getFoodName());
            group.setPrice(request.getPrice());
            group.setDescription(request.getDescription());
            group.setImageUrl(request.getImageUrl());
            group.setLatitude(request.getLatitude());
            group.setLongitude(request.getLongitude());
            group.setAccuracy(request.getAccuracy());
            group.setTriggerRadiusMeters(request.getTriggerRadiusMeters());
            group.setPriority(request.getPriority());
            group.setOriginalText(request.getText());
            group.setOriginalVoice(request.getVoice());
            group.setOriginalSpeed(request.getSpeed());
            group.setOriginalFormat(request.getTtsReturnOption());
            group.setOriginalWithoutFilter(request.getWithoutFilter());
            group.setUpdatedAt(Instant.now());
            ttsAudioGroupRepository.save(group);
        }

        return ttsAudioRepository.save(ttsAudio);
    }

    @Override
    @Transactional
    public TTSAudio updateTTSAudioWithNewFile(Long id, ReqTTSDTO request, byte[] audioData, String fileName)
            throws IOException, IdInvalidException {
        TTSAudio ttsAudio = getTTSAudioById(id);
        TTSAudioGroup group = ttsAudio.getGroup();
        String contentType = request.getTtsReturnOption() == 2 ? "audio/wav" : "audio/mpeg";
        String s3Url = saveAudioFile(audioData, fileName, contentType);

        // Cập nhật audio
        ttsAudio.setText(request.getText());
        ttsAudio.setVoice(request.getVoice());
        ttsAudio.setSpeed(request.getSpeed());
        ttsAudio.setFormat(request.getTtsReturnOption());
        ttsAudio.setWithoutFilter(request.getWithoutFilter());
        ttsAudio.setFileName("tts-audios/" + fileName);
        ttsAudio.setS3Url(s3Url);
        ttsAudio.setFileSize((long) audioData.length);
        ttsAudio.setMimeType(contentType);
        ttsAudio.setUpdatedAt(Instant.now());

        // Cập nhật group
        if (group != null) {
            group.setFoodName(request.getFoodName());
            group.setPrice(request.getPrice());
            group.setDescription(request.getDescription());
            group.setImageUrl(request.getImageUrl());
            group.setLatitude(request.getLatitude());
            group.setLongitude(request.getLongitude());
            group.setAccuracy(request.getAccuracy());
            group.setTriggerRadiusMeters(request.getTriggerRadiusMeters());
            group.setPriority(request.getPriority());
            group.setOriginalText(request.getText());
            group.setOriginalVoice(request.getVoice());
            group.setOriginalSpeed(request.getSpeed());
            group.setOriginalFormat(request.getTtsReturnOption());
            group.setOriginalWithoutFilter(request.getWithoutFilter());
            group.setUpdatedAt(Instant.now());
            ttsAudioGroupRepository.save(group);
        }

        return ttsAudioRepository.save(ttsAudio);
    }

    // ============ DELETE ============

    @Override
    @Transactional
    public void deleteTTSAudio(Long id) throws IOException, IdInvalidException {
        TTSAudio ttsAudio = getTTSAudioById(id);
        TTSAudioGroup group = ttsAudio.getGroup();

        // Xóa file
        if (ttsAudio.getS3Url() != null) {
            try {
                localStorageService.deleteFile(ttsAudio.getFileName());
            } catch (Exception e) {
                System.err.println("WARNING: Không thể xóa file: " + e.getMessage());
            }
        }

        // Xóa audio
        ttsAudioRepository.delete(ttsAudio);

        // Nếu là audio cuối cùng trong group -> xóa luôn group
        if (group != null) {
            List<TTSAudio> remaining = ttsAudioRepository.findByGroupId(group.getId());
            if (remaining == null || remaining.isEmpty()) {
                ttsAudioGroupRepository.delete(group);
            }
        }
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

    // ============ STORAGE HELPERS ============

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

    // ============ DTO CONVERTER ============

    private ResTTSAudioDTO convertToDTO(TTSAudio ttsAudio) {
        TTSAudioGroup group = ttsAudio.getGroup();
        String createdBy = group != null ? group.getCreatedBy() : null;
        Long userId = group != null && group.getUser() != null ? group.getUser().getId() : null;
        String userEmail = group != null && group.getUser() != null
                ? group.getUser().getEmail() : createdBy;
        String userFullName = group != null && group.getUser() != null
                ? (group.getUser().getFirstName() + " " + group.getUser().getLastName()).trim()
                : null;
        String userAvatar = group != null && group.getUser() != null ? group.getUser().getAvatar() : null;

        return ResTTSAudioDTO.builder()
                .id(ttsAudio.getId())
                .groupId(group != null ? group.getId() : null)
                .groupKey(group != null ? group.getGroupKey() : null)
                .languageCode(ttsAudio.getLanguageCode())
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
                .createdBy(createdBy)
                // Thông tin ẩm thực từ Group
                .foodName(group != null ? group.getFoodName() : null)
                .price(group != null ? group.getPrice() : null)
                .description(group != null ? group.getDescription() : null)
                .imageUrl(group != null ? group.getImageUrl() : null)
                // GPS từ Group
                .latitude(group != null ? group.getLatitude() : null)
                .longitude(group != null ? group.getLongitude() : null)
                .accuracy(group != null ? group.getAccuracy() : null)
                // Geofence từ Group
                .triggerRadiusMeters(group != null ? group.getTriggerRadiusMeters() : null)
                .priority(group != null ? group.getPriority() : null)
                // Original text/voice từ Group
                .originalText(group != null ? group.getOriginalText() : null)
                .originalVoice(group != null ? group.getOriginalVoice() : null)
                // User info
                .userId(userId)
                .userEmail(userEmail)
                .userFullName(userFullName)
                .userAvatar(userAvatar)
                .build();
    }

    // ============ MULTI-LANGUAGE ============

    @Override
    @Transactional
    public ResMultilingualAudioDTO createMultilingualAudio(ReqTTSDTO request) throws IOException {
        if (googleCloudTTSService == null || translationService == null) {
            throw new IOException("Google Cloud TTS or Translation service is not available");
        }

        String originalText = request.getText();
        String groupKey = UUID.randomUUID().toString();
        String createdBy = request.getCreatedBy() != null ? request.getCreatedBy() : "anonymous";
        String contentType = request.getTtsReturnOption() == 2 ? "audio/wav" : "audio/mpeg";
        User user = userServiceRepository.findByEmail(createdBy);

        // 1. Tạo Group với đầy đủ thông tin
        TTSAudioGroup group = TTSAudioGroup.builder()
                .groupKey(groupKey)
                .foodName(request.getFoodName())
                .price(request.getPrice())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .accuracy(request.getAccuracy())
                .triggerRadiusMeters(request.getTriggerRadiusMeters())
                .priority(request.getPriority())
                .originalText(originalText)
                .originalVoice(request.getVoice())
                .originalSpeed(request.getSpeed())
                .originalFormat(request.getTtsReturnOption())
                .originalWithoutFilter(request.getWithoutFilter())
                .createdBy(createdBy)
                .user(user)
                .createdAt(Instant.now())
                .build();
        group = ttsAudioGroupRepository.save(group);

        List<ResMultilingualAudioDTO.AudioEntry> entries = new ArrayList<>();
        float speed = request.getSpeed() != null ? request.getSpeed() : 1.0f;

        // 2. Tạo audio cho 6 ngôn ngữ (VI + 5 ngôn ngữ khác)
        String[] targetLangs = {
                SupportedLanguage.VI,
                SupportedLanguage.EN, SupportedLanguage.ZH,
                SupportedLanguage.JA, SupportedLanguage.KO, SupportedLanguage.FR
        };

        for (String lang : targetLangs) {
            // Text cho ngôn ngữ này
            String textForLang = lang.equals(SupportedLanguage.VI)
                    ? originalText
                    : translationService.translate(originalText, lang);

            if (textForLang == null || textForLang.isBlank()) {
                continue;
            }

            // Tạo audio
            byte[] audioData = googleCloudTTSService.synthesize(textForLang, lang, speed);

            String fileName = String.format("tts-audios/%s/%s-%d.mp3",
                    groupKey, lang, System.currentTimeMillis());
            String s3Url = saveAudioFile(audioData, fileName, "audio/mpeg");

            TTSAudio audio = TTSAudio.builder()
                    .group(group)
                    .languageCode(lang)
                    .text(textForLang)
                    .translatedText(lang.equals(SupportedLanguage.VI) ? textForLang : textForLang)
                    .voice(SupportedLanguage.getVoice(lang))
                    .speed(speed)
                    .format(3) // mp3
                    .withoutFilter(request.getWithoutFilter() != null ? request.getWithoutFilter() : false)
                    .fileName(fileName)
                    .s3Url(s3Url)
                    .fileSize((long) audioData.length)
                    .mimeType("audio/mpeg")
                    .createdAt(Instant.now())
                    .build();

            audio = ttsAudioRepository.save(audio);

            entries.add(ResMultilingualAudioDTO.AudioEntry.builder()
                    .id(audio.getId())
                    .languageCode(lang)
                    .languageName(SupportedLanguage.getName(lang))
                    .s3Url(s3Url)
                    .fileSize((long) audioData.length)
                    .build());

            System.out.println("✅ Đã tạo audio " + SupportedLanguage.getName(lang) + ": " + s3Url);
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

        String originalText = request.getText() != null ? request.getText()
                : (viAudio.getGroup() != null ? viAudio.getGroup().getOriginalText() : viAudio.getText());
        TTSAudioGroup group = viAudio.getGroup();

        // Nếu audio chưa có group -> tạo group mới
        if (group == null) {
            String groupKey = UUID.randomUUID().toString();
            group = TTSAudioGroup.builder()
                    .groupKey(groupKey)
                    .foodName(request.getFoodName())
                    .price(request.getPrice())
                    .description(request.getDescription())
                    .imageUrl(request.getImageUrl())
                    .latitude(request.getLatitude())
                    .longitude(request.getLongitude())
                    .accuracy(request.getAccuracy())
                    .triggerRadiusMeters(request.getTriggerRadiusMeters())
                    .priority(request.getPriority())
                    .originalText(originalText)
                    .originalVoice(request.getVoice() != null ? request.getVoice() : viAudio.getVoice())
                    .originalSpeed(request.getSpeed() != null ? request.getSpeed() : viAudio.getSpeed())
                    .originalFormat(request.getTtsReturnOption() != null ? request.getTtsReturnOption() : viAudio.getFormat())
                    .originalWithoutFilter(request.getWithoutFilter() != null ? request.getWithoutFilter() : viAudio.getWithoutFilter())
                    .createdBy(viAudio.getGroup() != null ? viAudio.getGroup().getCreatedBy() : null)
                    .createdAt(Instant.now())
                    .build();
            group = ttsAudioGroupRepository.save(group);

            // Link audio vào group
            viAudio.setGroup(group);
            viAudio.setLanguageCode(SupportedLanguage.VI);
            viAudio.setText(originalText);
            viAudio.setTranslatedText(originalText);
            ttsAudioRepository.save(viAudio);
        }

        // Kiểm tra audio nào đã tồn tại trong group
        Map<String, TTSAudio> existingByLang = group.getAudios().stream()
                .collect(Collectors.toMap(
                        a -> a.getLanguageCode() != null ? a.getLanguageCode() : SupportedLanguage.VI,
                        a -> a,
                        (a1, a2) -> a1));

        List<ResMultilingualAudioDTO.AudioEntry> entries = new ArrayList<>();
        float speed = request.getSpeed() != null ? request.getSpeed()
                : (group.getOriginalSpeed() != null ? group.getOriginalSpeed() : 1.0f);

        String[] targetLangs = {
                SupportedLanguage.VI,
                SupportedLanguage.EN, SupportedLanguage.ZH,
                SupportedLanguage.JA, SupportedLanguage.KO, SupportedLanguage.FR
        };

        for (String lang : targetLangs) {
            TTSAudio existing = existingByLang.get(lang);

            if (existing != null) {
                // Audio đã tồn tại -> thêm vào entries (không tạo lại)
                entries.add(ResMultilingualAudioDTO.AudioEntry.builder()
                        .id(existing.getId())
                        .languageCode(lang)
                        .languageName(SupportedLanguage.getName(lang))
                        .s3Url(existing.getS3Url())
                        .fileSize(existing.getFileSize())
                        .build());
                System.out.println("⏭️  Audio " + SupportedLanguage.getName(lang) + " đã tồn tại, bỏ qua.");
                continue;
            }

            // Tạo audio mới cho ngôn ngữ này
            String textForLang = lang.equals(SupportedLanguage.VI)
                    ? originalText
                    : translationService.translate(originalText, lang);

            if (textForLang == null || textForLang.isBlank()) {
                continue;
            }

            try {
                byte[] audioData = googleCloudTTSService.synthesize(textForLang, lang, speed);

                String fileName = String.format("tts-audios/%s/%s-%d.mp3",
                        group.getGroupKey(), lang, System.currentTimeMillis());
                String s3Url = saveAudioFile(audioData, fileName, "audio/mpeg");

                TTSAudio audio = TTSAudio.builder()
                        .group(group)
                        .languageCode(lang)
                        .text(textForLang)
                        .translatedText(textForLang)
                        .voice(SupportedLanguage.getVoice(lang))
                        .speed(speed)
                        .format(3)
                        .withoutFilter(group.getOriginalWithoutFilter() != null ? group.getOriginalWithoutFilter() : false)
                        .fileName(fileName)
                        .s3Url(s3Url)
                        .fileSize((long) audioData.length)
                        .mimeType("audio/mpeg")
                        .createdAt(Instant.now())
                        .build();

                audio = ttsAudioRepository.save(audio);

                entries.add(ResMultilingualAudioDTO.AudioEntry.builder()
                        .id(audio.getId())
                        .languageCode(lang)
                        .languageName(SupportedLanguage.getName(lang))
                        .s3Url(s3Url)
                        .fileSize((long) audioData.length)
                        .build());

                System.out.println("✅ Đã tạo audio " + SupportedLanguage.getName(lang) + ": " + s3Url);
            } catch (Exception e) {
                System.err.println("⚠️  Không thể tạo audio " + lang + ": " + e.getMessage());
            }
        }

        return ResMultilingualAudioDTO.builder()
                .groupId(group.getGroupKey())
                .audios(entries)
                .build();
    }

    // ============ GROUP DTO BUILDER ============

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
                .price(group.getPrice())
                .description(group.getDescription())
                .imageUrl(group.getImageUrl())
                .latitude(group.getLatitude())
                .longitude(group.getLongitude())
                .accuracy(group.getAccuracy())
                .triggerRadiusMeters(group.getTriggerRadiusMeters())
                .priority(group.getPriority())
                .originalText(group.getOriginalText())
                .originalVoice(group.getOriginalVoice())
                .originalSpeed(group.getOriginalSpeed())
                .originalFormat(group.getOriginalFormat())
                .originalWithoutFilter(group.getOriginalWithoutFilter())
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .createdBy(group.getCreatedBy())
                .audios(entries)
                .build();
    }

    // ============ Group CRUD ============

    @Override
    public Page<ResTTSAudioGroupDTO> getAllGroups(Pageable pageable) {
        Page<TTSAudioGroup> groups = ttsAudioGroupRepository.findAllOrderByCreatedAtDesc(pageable);
        return groups.map(this::buildGroupDTO);
    }

    @Override
    @Transactional
    public void deleteGroup(Long id) throws IOException, IdInvalidException {
        TTSAudioGroup group = ttsAudioGroupRepository.findById(id)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy group với id: " + id));

        // Xóa tất cả audio files trong group từ S3
        if (group.getAudios() != null) {
            for (TTSAudio audio : group.getAudios()) {
                if (audio.getFileName() != null) {
                    try {
                        localStorageService.deleteFile(audio.getFileName());
                    } catch (Exception e) {
                        System.err.println("⚠️ Không thể xóa file: " + e.getMessage());
                    }
                }
            }
        }

        // Xóa group (cascade sẽ xóa các audio records)
        ttsAudioGroupRepository.delete(group);
    }

    @Override
    public ResMultilingualAudioDTO generateMultilingualForGroup(Long groupId) throws IOException, IdInvalidException {
        TTSAudioGroup group = ttsAudioGroupRepository.findById(groupId)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy group với id: " + groupId));

        // Lấy audio tiếng Việt trong group
        TTSAudio viAudio = null;
        if (group.getAudios() != null) {
            for (TTSAudio audio : group.getAudios()) {
                if (SupportedLanguage.VI.equals(audio.getLanguageCode())) {
                    viAudio = audio;
                    break;
                }
            }
        }

        if (viAudio == null) {
            throw new IdInvalidException("Không tìm thấy audio tiếng Việt trong group");
        }

        ReqTTSDTO request = new ReqTTSDTO();
        request.setText(group.getOriginalText());
        request.setVoice(group.getOriginalVoice());
        request.setSpeed(group.getOriginalSpeed());
        request.setTtsReturnOption(group.getOriginalFormat());
        request.setWithoutFilter(group.getOriginalWithoutFilter());
        request.setFoodName(group.getFoodName());
        request.setPrice(group.getPrice());
        request.setDescription(group.getDescription());
        request.setImageUrl(group.getImageUrl());
        request.setLatitude(group.getLatitude());
        request.setLongitude(group.getLongitude());
        request.setAccuracy(group.getAccuracy());
        request.setTriggerRadiusMeters(group.getTriggerRadiusMeters());
        request.setPriority(group.getPriority());
        request.setCreatedBy(group.getCreatedBy());

        return createMultilingualForExisting(viAudio, request);
    }

    @Override
    @Transactional
    public ResTTSAudioGroupDTO updateGroup(Long id, ReqUpdateTTSAudioGroupDTO req) throws IdInvalidException {
        TTSAudioGroup group = ttsAudioGroupRepository.findById(id)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy group với id: " + id));

        group.setFoodName(req.getFoodName());
        group.setPrice(req.getPrice());
        group.setDescription(req.getDescription());
        group.setImageUrl(req.getImageUrl());
        group.setLatitude(req.getLatitude());
        group.setLongitude(req.getLongitude());
        group.setAccuracy(req.getAccuracy());
        group.setTriggerRadiusMeters(req.getTriggerRadiusMeters());
        group.setPriority(req.getPriority());
        group.setOriginalText(req.getOriginalText());
        group.setOriginalVoice(req.getOriginalVoice());
        group.setOriginalSpeed(req.getOriginalSpeed());
        group.setOriginalFormat(req.getOriginalFormat());
        group.setOriginalWithoutFilter(
                req.getOriginalWithoutFilter() != null ? req.getOriginalWithoutFilter() : false);
        group.setUpdatedAt(Instant.now());

        ttsAudioRepository.findByGroupIdAndLanguageCode(id, SupportedLanguage.VI).ifPresent(vi -> {
            vi.setText(req.getOriginalText());
            vi.setTranslatedText(req.getOriginalText());
            vi.setUpdatedAt(Instant.now());
            ttsAudioRepository.save(vi);
        });

        ttsAudioGroupRepository.save(group);
        return buildGroupDTO(group);
    }

    // ============ PRIVATE HELPERS ============

    private String saveAudioFile(byte[] audioData, String fileName, String contentType) {
        try {
            String s3Url = localStorageService.uploadFile(
                    new ByteArrayInputStream(audioData),
                    fileName,
                    contentType,
                    "");
            System.out.println("✅ LƯU FILE THÀNH CÔNG: " + s3Url);
            return s3Url;
        } catch (Exception e) {
            System.err.println("❌ LƯU FILE THẤT BẠI: " + e.getMessage());
            return null;
        }
    }
}

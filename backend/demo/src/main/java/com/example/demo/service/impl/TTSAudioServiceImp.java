package com.example.demo.service.impl;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.domain.AudioData;
import com.example.demo.domain.TTSAudio;
import com.example.demo.domain.User;
import com.example.demo.domain.TTSAudioGroup;
import com.example.demo.domain.dto.SupportedLanguage;
import com.example.demo.domain.request.tts.ReqTTSDTO;
import com.example.demo.domain.request.tts.ReqUpdateTTSAudioGroupDTO;
import com.example.demo.domain.response.tts.ResAudioDataDTO;
import com.example.demo.domain.response.tts.ResTTSAudioDTO;
import com.example.demo.domain.response.tts.ResTTSAudioGroupDTO;
import com.example.demo.repository.TTSAudioGroupRepository;
import com.example.demo.repository.TTSAudioRepository;
import com.example.demo.repository.UserServiceRepository;
import com.example.demo.service.GoogleCloudTTSService;
import com.example.demo.service.LocalStorageService;
import com.example.demo.service.TTSAudioService;
import com.example.demo.service.TTSService;
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

    @Autowired
    private TTSService ttsService;

    // ============ READ — TTSAudio (chỉ xem) ============

    @Override
    public ResTTSAudioDTO getTTSAudioById(Long id) throws IdInvalidException {
        TTSAudio ttsAudio = ttsAudioRepository.findById(id)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy TTS audio với id: " + id));
        return convertToDTO(ttsAudio);
    }

    @Override
    public Page<ResTTSAudioDTO> getAllTTSAudios(Pageable pageable) {
        Page<TTSAudio> ttsAudios = ttsAudioRepository.findAll(pageable);
        return ttsAudios.map(this::convertToDTO);
    }

    // ============ Group CRUD ============

    /**
     * Tạo mới một group: lưu metadata + tạo audio tiếng Việt + tạo audio đa ngôn ngữ (nếu có).
     */
    @Override
    @Transactional
    public ResTTSAudioGroupDTO createGroup(ReqTTSDTO request) throws IOException {
        String createdBy = request.getCreatedBy() != null ? request.getCreatedBy() : "anonymous";
        User user = userServiceRepository.findByEmail(createdBy);
        String groupKey = UUID.randomUUID().toString();
        float speed = request.getSpeed() != null ? request.getSpeed() : 1.0f;

        // 1. Tạo Group
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
                .originalText(request.getText())
                .originalVoice(request.getVoice())
                .originalSpeed(speed)
                .originalFormat(request.getTtsReturnOption())
                .originalWithoutFilter(request.getWithoutFilter() != null ? request.getWithoutFilter() : false)
                .createdBy(createdBy)
                .user(user)
                .createdAt(Instant.now())
                .audioMap(new HashMap<>())
                .build();
        group = ttsAudioGroupRepository.save(group);

        // 2. Tạo audio cho 6 ngôn ngữ (VI + 5 ngôn ngữ khác)
        List<String> targetLangs = List.of(
                SupportedLanguage.VI,
                SupportedLanguage.EN, SupportedLanguage.ZH,
                SupportedLanguage.JA, SupportedLanguage.KO, SupportedLanguage.FR);

        for (String lang : targetLangs) {
            String textForLang = lang.equals(SupportedLanguage.VI)
                    ? request.getText()
                    : (translationService != null ? translationService.translate(request.getText(), lang) : null);

            if (textForLang == null || textForLang.isBlank()) {
                continue;
            }

            try {
                byte[] audioData;
                String voiceCode = lang.equals(SupportedLanguage.VI)
                        ? request.getVoice()
                        : SupportedLanguage.getVoice(lang);
                String mimeType;
                String fileExt;

                if (lang.equals(SupportedLanguage.VI)) {
                    ReqTTSDTO viReq = new ReqTTSDTO();
                    viReq.setText(textForLang);
                    viReq.setVoice(request.getVoice());
                    viReq.setSpeed(speed);
                    viReq.setTtsReturnOption(request.getTtsReturnOption());
                    viReq.setWithoutFilter(request.getWithoutFilter() != null ? request.getWithoutFilter() : false);
                    audioData = ttsService.synthesizeViettelSpeechBytes(viReq);
                    mimeType = request.getTtsReturnOption() == 2 ? "audio/wav" : "audio/mpeg";
                    fileExt = request.getTtsReturnOption() == 2 ? "wav" : "mp3";
                } else if (googleCloudTTSService != null) {
                    audioData = googleCloudTTSService.synthesize(textForLang, lang, speed);
                    mimeType = "audio/mpeg";
                    fileExt = "mp3";
                } else {
                    continue;
                }

                String fileName = String.format("tts-audios/%s/%s-%d.%s", groupKey, lang, System.currentTimeMillis(), fileExt);
                String s3Url = saveAudioFile(audioData, fileName, mimeType);

                // Lưu TTSAudio riêng (dùng bảng cũ)
                TTSAudio ttsAudio = TTSAudio.builder()
                        .group(group)
                        .languageCode(lang)
                        .text(textForLang)
                        .translatedText(textForLang)
                        .voice(voiceCode)
                        .speed(speed)
                        .format(request.getTtsReturnOption())
                        .withoutFilter(request.getWithoutFilter() != null ? request.getWithoutFilter() : false)
                        .fileName(fileName)
                        .s3Url(s3Url)
                        .fileSize((long) audioData.length)
                        .mimeType(mimeType)
                        .createdAt(Instant.now())
                        .build();
                ttsAudioRepository.save(ttsAudio);

                // Lưu vào audioMap của Group
                AudioData audioEntry = AudioData.builder()
                        .fileName(fileName)
                        .s3Url(s3Url)
                        .fileSize((long) audioData.length)
                        .mimeType(mimeType)
                        .build();
                group.getAudioMap().put(lang, audioEntry);

                System.out.println("✅ Đã tạo audio " + SupportedLanguage.getName(lang) + ": " + s3Url);
            } catch (Exception e) {
                System.err.println("⚠️  Không thể tạo audio " + lang + ": " + e.getMessage());
            }
        }

        group = ttsAudioGroupRepository.save(group);
        return buildGroupDTO(group);
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
    public Page<ResTTSAudioGroupDTO> getAllGroups(Pageable pageable) {
        Page<TTSAudioGroup> groups = ttsAudioGroupRepository.findAllOrderByCreatedAtDesc(pageable);
        return groups.map(this::buildGroupDTO);
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
        group.setOriginalWithoutFilter(req.getOriginalWithoutFilter() != null ? req.getOriginalWithoutFilter() : false);
        group.setUpdatedAt(Instant.now());

        group = ttsAudioGroupRepository.save(group);
        return buildGroupDTO(group);
    }

    @Override
    @Transactional
    public void deleteGroup(Long id) throws IOException, IdInvalidException {
        TTSAudioGroup group = ttsAudioGroupRepository.findById(id)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy group với id: " + id));

        // Xóa tất cả audio files trong group từ storage
        if (group.getAudioMap() != null) {
            for (AudioData audioData : group.getAudioMap().values()) {
                if (audioData.getFileName() != null) {
                    try {
                        localStorageService.deleteFile(audioData.getFileName());
                    } catch (Exception e) {
                        System.err.println("⚠️ Không thể xóa file: " + e.getMessage());
                    }
                }
            }
        }

        // Xóa tất cả TTSAudio records của group
        ttsAudioRepository.findAll().stream()
                .filter(a -> a.getGroup() != null && a.getGroup().getId().equals(id))
                .forEach(ttsAudioRepository::delete);

        // Xóa group (cascade sẽ xóa các audio records)
        ttsAudioGroupRepository.delete(group);
    }

    // ============ Audio File ============

    /**
     * Sinh audio đa ngôn ngữ cho một group đã tồn tại.
     */
    @Override
    @Transactional
    public Map<String, ResAudioDataDTO> generateMultilingualAudio(Long groupId) throws IOException, IdInvalidException {
        TTSAudioGroup group = ttsAudioGroupRepository.findById(groupId)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy group với id: " + groupId));

        boolean viMissing = group.getAudioMap() == null || !group.getAudioMap().containsKey(SupportedLanguage.VI);
        List<String> foreignLangs = List.of(
                SupportedLanguage.EN, SupportedLanguage.ZH,
                SupportedLanguage.JA, SupportedLanguage.KO, SupportedLanguage.FR);
        boolean anyForeignMissing = foreignLangs.stream().anyMatch(
                l -> group.getAudioMap() == null || !group.getAudioMap().containsKey(l));

        if (viMissing && ttsService == null) {
            throw new IOException("Viettel TTS (tiếng Việt) không khả dụng");
        }
        if (anyForeignMissing && (googleCloudTTSService == null || translationService == null)) {
            throw new IOException("Google Cloud TTS hoặc dịch thuật không khả dụng");
        }

        String originalText = group.getOriginalText();
        float speed = group.getOriginalSpeed() != null ? group.getOriginalSpeed() : 1.0f;
        String contentType = "audio/mpeg";
        Map<String, ResAudioDataDTO> result = new HashMap<>();

        List<String> targetLangs = List.of(
                SupportedLanguage.VI,
                SupportedLanguage.EN, SupportedLanguage.ZH,
                SupportedLanguage.JA, SupportedLanguage.KO, SupportedLanguage.FR);

        for (String lang : targetLangs) {
            // Nếu audio đã tồn tại trong group -> bỏ qua
            if (group.getAudioMap() != null && group.getAudioMap().containsKey(lang)) {
                AudioData existing = group.getAudioMap().get(lang);
                result.put(lang, ResAudioDataDTO.builder()
                        .fileName(existing.getFileName())
                        .s3Url(existing.getS3Url())
                        .fileSize(existing.getFileSize())
                        .mimeType(existing.getMimeType())
                        .build());
                System.out.println("⏭️  Audio " + SupportedLanguage.getName(lang) + " đã tồn tại, bỏ qua.");
                continue;
            }

            String textForLang = lang.equals(SupportedLanguage.VI)
                    ? originalText
                    : translationService.translate(originalText, lang);

            if (textForLang == null || textForLang.isBlank()) {
                continue;
            }

            try {
                byte[] audioData;
                String mimeForFile;
                String fileExt;
                String voiceCode;
                int formatCode;

                if (lang.equals(SupportedLanguage.VI)) {
                    ReqTTSDTO viReq = new ReqTTSDTO();
                    viReq.setText(textForLang);
                    viReq.setVoice(group.getOriginalVoice());
                    viReq.setSpeed(speed);
                    viReq.setTtsReturnOption(group.getOriginalFormat() != null ? group.getOriginalFormat() : 3);
                    viReq.setWithoutFilter(group.getOriginalWithoutFilter() != null ? group.getOriginalWithoutFilter() : false);
                    audioData = ttsService.synthesizeViettelSpeechBytes(viReq);
                    formatCode = group.getOriginalFormat() != null ? group.getOriginalFormat() : 3;
                    mimeForFile = formatCode == 2 ? "audio/wav" : "audio/mpeg";
                    fileExt = formatCode == 2 ? "wav" : "mp3";
                    voiceCode = group.getOriginalVoice();
                } else {
                    audioData = googleCloudTTSService.synthesize(textForLang, lang, speed);
                    formatCode = 3;
                    mimeForFile = contentType;
                    fileExt = "mp3";
                    voiceCode = SupportedLanguage.getVoice(lang);
                }

                String fileName = String.format("tts-audios/%s/%s-%d.%s",
                        group.getGroupKey(), lang, System.currentTimeMillis(), fileExt);
                String s3Url = saveAudioFile(audioData, fileName, mimeForFile);

                // Lưu TTSAudio riêng
                TTSAudio ttsAudio = TTSAudio.builder()
                        .group(group)
                        .languageCode(lang)
                        .text(textForLang)
                        .translatedText(textForLang)
                        .voice(voiceCode)
                        .speed(speed)
                        .format(formatCode)
                        .withoutFilter(group.getOriginalWithoutFilter() != null ? group.getOriginalWithoutFilter() : false)
                        .fileName(fileName)
                        .s3Url(s3Url)
                        .fileSize((long) audioData.length)
                        .mimeType(mimeForFile)
                        .createdAt(Instant.now())
                        .build();
                ttsAudioRepository.save(ttsAudio);

                // Lưu vào audioMap
                if (group.getAudioMap() == null) {
                    group.setAudioMap(new HashMap<>());
                }
                AudioData audioEntry = AudioData.builder()
                        .fileName(fileName)
                        .s3Url(s3Url)
                        .fileSize((long) audioData.length)
                        .mimeType(mimeForFile)
                        .build();
                group.getAudioMap().put(lang, audioEntry);

                result.put(lang, ResAudioDataDTO.builder()
                        .fileName(fileName)
                        .s3Url(s3Url)
                        .fileSize((long) audioData.length)
                        .mimeType(mimeForFile)
                        .build());

                System.out.println("✅ Đã tạo audio " + SupportedLanguage.getName(lang) + ": " + s3Url);
            } catch (Exception e) {
                System.err.println("⚠️  Không thể tạo audio " + lang + ": " + e.getMessage());
            }
        }

        ttsAudioGroupRepository.save(group);
        return result;
    }

    /**
     * Lấy file audio từ storage dựa vào groupKey và languageCode.
     */
    @Override
    public Resource getAudioResource(String groupKey, String languageCode) throws IdInvalidException {
        TTSAudioGroup group = ttsAudioGroupRepository.findByGroupKey(groupKey)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy group với key: " + groupKey));

        AudioData audioData = group.getAudioMap() != null ? group.getAudioMap().get(languageCode) : null;
        if (audioData == null || audioData.getFileName() == null) {
            throw new IdInvalidException("Không tìm thấy audio cho ngôn ngữ: " + languageCode);
        }

        try {
            InputStream inputStream = localStorageService.getFileInputStream(audioData.getFileName());
            return new InputStreamResource(inputStream);
        } catch (Exception e) {
            throw new IdInvalidException("Không thể lấy file audio: " + e.getMessage());
        }
    }

    // ============ Helpers ============

    @Override
    public void deleteAudioFile(String fileName) throws IOException {
        if (fileName != null) {
            try {
                localStorageService.deleteFile(fileName);
            } catch (Exception e) {
                throw new IOException("Không thể xóa file: " + e.getMessage(), e);
            }
        }
    }

    @Override
    public Resource getImageResource(String fileName) throws IOException {
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
                .translatedText(ttsAudio.getTranslatedText())
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
                .foodName(group != null ? group.getFoodName() : null)
                .price(group != null ? group.getPrice() : null)
                .description(group != null ? group.getDescription() : null)
                .imageUrl(group != null ? group.getImageUrl() : null)
                .latitude(group != null ? group.getLatitude() : null)
                .longitude(group != null ? group.getLongitude() : null)
                .accuracy(group != null ? group.getAccuracy() : null)
                .triggerRadiusMeters(group != null ? group.getTriggerRadiusMeters() : null)
                .priority(group != null ? group.getPriority() : null)
                .originalText(group != null ? group.getOriginalText() : null)
                .originalVoice(group != null ? group.getOriginalVoice() : null)
                .userId(userId)
                .userEmail(userEmail)
                .userFullName(userFullName)
                .userAvatar(userAvatar)
                .build();
    }

    private ResTTSAudioGroupDTO buildGroupDTO(TTSAudioGroup group) {
        Map<String, ResAudioDataDTO> audioMapDTO = new HashMap<>();

        if (group.getAudioMap() != null) {
            audioMapDTO = group.getAudioMap().entrySet().stream()
                    .collect(Collectors.toMap(
                            Map.Entry::getKey,
                            e -> ResAudioDataDTO.builder()
                                    .fileName(e.getValue().getFileName())
                                    .s3Url(e.getValue().getS3Url())
                                    .fileSize(e.getValue().getFileSize())
                                    .mimeType(e.getValue().getMimeType())
                                    .build()));
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
                .audioMap(audioMapDTO)
                .createdBy(group.getCreatedBy())
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .build();
    }

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

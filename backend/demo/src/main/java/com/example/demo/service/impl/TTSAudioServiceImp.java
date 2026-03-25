package com.example.demo.service.impl;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.HashMap;
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
import com.example.demo.domain.POI;
import com.example.demo.domain.TTSAudio;
import com.example.demo.domain.User;
import com.example.demo.domain.TTSAudioGroup;
import com.example.demo.domain.dto.SupportedLanguage;
import com.example.demo.domain.request.tts.ReqTTSDTO;
import com.example.demo.domain.request.tts.ReqUpdateTTSAudioGroupDTO;
import com.example.demo.domain.response.tts.ResAudioDataDTO;
import com.example.demo.domain.response.tts.ResTTSAudioDTO;
import com.example.demo.domain.response.tts.ResTTSAudioGroupDTO;
import com.example.demo.repository.POIRepository;
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

    @Autowired private TTSAudioRepository ttsAudioRepository;
    @Autowired private TTSAudioGroupRepository ttsAudioGroupRepository;
    @Autowired private POIRepository poiRepository;
    @Autowired private UserServiceRepository userServiceRepository;
    @Autowired private LocalStorageService localStorageService;
    @Autowired(required = false) private GoogleCloudTTSService googleCloudTTSService;
    @Autowired(required = false) private TranslationService translationService;
    @Autowired private TTSService ttsService;

    // ============= TTSAudio READ =============

    @Override
    public ResTTSAudioDTO getTTSAudioById(Long id) throws IdInvalidException {
        TTSAudio ttsAudio = ttsAudioRepository.findById(id)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy TTS audio: " + id));
        return toTTSAudioDTO(ttsAudio);
    }

    @Override
    public Page<ResTTSAudioDTO> getAllTTSAudios(Pageable pageable) {
        return ttsAudioRepository.findAll(pageable).map(this::toTTSAudioDTO);
    }

    // ============= Group CRUD =============

    @Override
    @Transactional
    public ResTTSAudioGroupDTO createGroup(ReqTTSDTO req) throws IOException, IdInvalidException {
        POI poi = poiRepository.findById(req.getPoiId())
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy POI: " + req.getPoiId()));

        String createdBy = req.getCreatedBy() != null ? req.getCreatedBy() : "anonymous";
        User user = userServiceRepository.findByEmail(createdBy).orElse(null);

        TTSAudioGroup group = TTSAudioGroup.builder()
                .groupKey(UUID.randomUUID().toString())
                .poi(poi)
                .originalText(req.getText())
                .originalVoice(req.getVoice())
                .originalSpeed(req.getSpeed() != null ? req.getSpeed() : 1.0f)
                .originalFormat(req.getTtsReturnOption())
                .originalWithoutFilter(req.getWithoutFilter() != null ? req.getWithoutFilter() : false)
                .createdBy(createdBy)
                .createdAt(Instant.now())
                .audioMap(new HashMap<>())
                .build();
        group = ttsAudioGroupRepository.save(group);

        generateAudiosForGroup(group, req.getText(), req.getVoice(), req.getSpeed(), req.getTtsReturnOption(), req.getWithoutFilter());

        group = ttsAudioGroupRepository.save(group);
        return toGroupDTO(group);
    }

    @Override
    public ResTTSAudioGroupDTO getGroupById(Long id) throws IdInvalidException {
        TTSAudioGroup group = ttsAudioGroupRepository.findById(id)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy group: " + id));
        return toGroupDTO(group);
    }

    @Override
    public ResTTSAudioGroupDTO getGroupByKey(String groupKey) throws IdInvalidException {
        TTSAudioGroup group = ttsAudioGroupRepository.findByGroupKey(groupKey)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy group: " + groupKey));
        return toGroupDTO(group);
    }

    @Override
    public Page<ResTTSAudioGroupDTO> getAllGroups(Pageable pageable) {
        return ttsAudioGroupRepository.findAllOrderByCreatedAtDesc(pageable).map(this::toGroupDTO);
    }

    @Override
    @Transactional
    public ResTTSAudioGroupDTO updateGroup(Long id, ReqUpdateTTSAudioGroupDTO req) throws IdInvalidException {
        TTSAudioGroup group = ttsAudioGroupRepository.findById(id)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy group: " + id));

        group.setOriginalText(req.getOriginalText());
        group.setOriginalVoice(req.getOriginalVoice());
        group.setOriginalSpeed(req.getOriginalSpeed());
        group.setOriginalFormat(req.getOriginalFormat());
        group.setOriginalWithoutFilter(req.getOriginalWithoutFilter() != null ? req.getOriginalWithoutFilter() : false);
        group.setUpdatedAt(Instant.now());

        group = ttsAudioGroupRepository.save(group);
        return toGroupDTO(group);
    }

    @Override
    @Transactional
    public void deleteGroup(Long id) throws IOException, IdInvalidException {
        TTSAudioGroup group = ttsAudioGroupRepository.findById(id)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy group: " + id));

        // Xóa file trong storage
        if (group.getAudioMap() != null) {
            for (AudioData ad : group.getAudioMap().values()) {
                if (ad.getFileName() != null) {
                    try {
                        localStorageService.deleteFile(ad.getFileName());
                    } catch (Exception e) {
                        System.err.println("⚠️ Không xóa được file: " + e.getMessage());
                    }
                }
            }
        }

        // Xóa TTSAudio records
        ttsAudioRepository.findAll().stream()
                .filter(a -> a.getGroup() != null && a.getGroup().getId().equals(id))
                .forEach(ttsAudioRepository::delete);

        ttsAudioGroupRepository.delete(group);
    }

    // ============= Audio Generation =============

    @Override
    @Transactional
    public Map<String, ResAudioDataDTO> generateMultilingualAudio(Long groupId) throws IOException, IdInvalidException {
        TTSAudioGroup group = ttsAudioGroupRepository.findById(groupId)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy group: " + groupId));

        String text = group.getOriginalText();
        float speed = group.getOriginalSpeed() != null ? group.getOriginalSpeed() : 1.0f;
        boolean withoutFilter = group.getOriginalWithoutFilter() != null ? group.getOriginalWithoutFilter() : false;
        int format = group.getOriginalFormat() != null ? group.getOriginalFormat() : 3;

        if (group.getAudioMap() == null) {
            group.setAudioMap(new HashMap<>());
        }

        Map<String, ResAudioDataDTO> result = new HashMap<>();

        for (String lang : SupportedLanguage.ALL) {
            if (group.getAudioMap().containsKey(lang)) {
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
                    ? text
                    : (translationService != null ? translationService.translate(text, lang) : null);

            if (textForLang == null || textForLang.isBlank()) {
                continue;
            }

            AudioResult audio = synthesizeForLang(group.getGroupKey(), lang, textForLang,
                    lang.equals(SupportedLanguage.VI) ? group.getOriginalVoice() : SupportedLanguage.getVoice(lang),
                    speed, format, withoutFilter);

            if (audio == null) {
                continue;
            }

            saveAudioRecord(group, lang, textForLang, audio);
            group.getAudioMap().put(lang, audio.toAudioData());
            result.put(lang, audio.toDTO());
        }

        ttsAudioGroupRepository.save(group);
        return result;
    }

    // ============= Audio File =============

    @Override
    public Resource getAudioResource(String groupKey, String languageCode) throws IdInvalidException {
        TTSAudioGroup group = ttsAudioGroupRepository.findByGroupKey(groupKey)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy group: " + groupKey));

        AudioData audioData = group.getAudioMap() != null ? group.getAudioMap().get(languageCode) : null;
        if (audioData == null || audioData.getFileName() == null) {
            throw new IdInvalidException("Không tìm thấy audio cho ngôn ngữ: " + languageCode);
        }

        try {
            InputStream inputStream = localStorageService.getFileInputStream(audioData.getFileName());
            return new InputStreamResource(inputStream);
        } catch (Exception e) {
            throw new IdInvalidException("Không lấy được file audio: " + e.getMessage());
        }
    }

    @Override
    public void deleteAudioFile(String fileName) throws IOException {
        if (fileName != null) {
            try {
                localStorageService.deleteFile(fileName);
            } catch (Exception e) {
                throw new IOException("Không xóa được file: " + e.getMessage(), e);
            }
        }
    }

    @Override
    public Resource getImageResource(String fileName) throws IOException {
        try {
            return new InputStreamResource(localStorageService.getFileInputStream(fileName));
        } catch (Exception e) {
            throw new IOException("Không lấy được ảnh: " + e.getMessage(), e);
        }
    }

    // ============= Private Helpers =============

    /**
     * Tạo audio cho tất cả ngôn ngữ khi create group.
     */
    private void generateAudiosForGroup(TTSAudioGroup group, String text, String viVoice,
            Float speed, Integer ttsReturnOption, Boolean withoutFilter) throws IOException {
        float s = speed != null ? speed : 1.0f;
        int fmt = ttsReturnOption != null ? ttsReturnOption : 3;
        boolean noFilter = withoutFilter != null ? withoutFilter : false;

        for (String lang : SupportedLanguage.ALL) {
            String textForLang = lang.equals(SupportedLanguage.VI)
                    ? text
                    : (translationService != null ? translationService.translate(text, lang) : null);

            if (textForLang == null || textForLang.isBlank()) {
                continue;
            }

            String voice = lang.equals(SupportedLanguage.VI)
                    ? viVoice
                    : SupportedLanguage.getVoice(lang);

            AudioResult audio = synthesizeForLang(group.getGroupKey(), lang, textForLang, voice, s, fmt, noFilter);
            if (audio == null) {
                continue;
            }

            saveAudioRecord(group, lang, textForLang, audio);
            group.getAudioMap().put(lang, audio.toAudioData());
        }
    }

    /**
     * Synthesize audio cho 1 ngôn ngữ cụ thể.
     * Trả về AudioResult hoặc null nếu service không khả dụng.
     */
    private AudioResult synthesizeForLang(String groupKey, String lang, String text, String voice,
            float speed, int format, boolean withoutFilter) {
        try {
            byte[] audioData;
            String mimeType;
            String fileExt;

            if (lang.equals(SupportedLanguage.VI)) {
                ReqTTSDTO viReq = new ReqTTSDTO();
                viReq.setText(text);
                viReq.setVoice(voice);
                viReq.setSpeed(speed);
                viReq.setTtsReturnOption(format);
                viReq.setWithoutFilter(withoutFilter);
                audioData = ttsService.synthesizeViettelSpeechBytes(viReq);
                mimeType = format == 2 ? "audio/wav" : "audio/mpeg";
                fileExt = format == 2 ? "wav" : "mp3";
            } else if (googleCloudTTSService != null) {
                audioData = googleCloudTTSService.synthesize(text, lang, speed);
                mimeType = "audio/mpeg";
                fileExt = "mp3";
            } else {
                return null;
            }

            String fileName = String.format("tts-audios/%s/%s-%d.%s",
                    groupKey, lang, System.currentTimeMillis(), fileExt);
            String s3Url = saveAudioFile(audioData, fileName, mimeType);

            return new AudioResult(audioData.length, s3Url, fileName, mimeType);
        } catch (Exception e) {
            System.err.println("⚠️ Không tạo được audio " + lang + ": " + e.getMessage());
            return null;
        }
    }

    /**
     * Lưu TTSAudio record vào DB + log.
     */
    private void saveAudioRecord(TTSAudioGroup group, String lang, String textForLang, AudioResult audio) {
        TTSAudio ttsAudio = TTSAudio.builder()
                .group(group)
                .languageCode(lang)
                .text(textForLang)
                .translatedText(textForLang)
                .voice(lang.equals(SupportedLanguage.VI)
                        ? group.getOriginalVoice()
                        : SupportedLanguage.getVoice(lang))
                .speed(group.getOriginalSpeed() != null ? group.getOriginalSpeed() : 1.0f)
                .format(group.getOriginalFormat() != null ? group.getOriginalFormat() : 3)
                .withoutFilter(group.getOriginalWithoutFilter())
                .fileName(audio.fileName())
                .s3Url(audio.s3Url())
                .fileSize((long) audio.fileSize())
                .mimeType(audio.mimeType())
                .createdAt(Instant.now())
                .build();
        ttsAudioRepository.save(ttsAudio);
        System.out.println("✅ Audio " + SupportedLanguage.getName(lang) + ": " + audio.s3Url());
    }

    private String saveAudioFile(byte[] audioData, String fileName, String mimeType) {
        try {
            String s3Url = localStorageService.uploadFile(
                    new ByteArrayInputStream(audioData), fileName, mimeType, "");
            System.out.println("✅ Lưu file: " + s3Url);
            return s3Url;
        } catch (Exception e) {
            System.err.println("❌ Lưu file thất bại: " + e.getMessage());
            return null;
        }
    }

    // ============= DTO Converters =============

    private ResTTSAudioDTO toTTSAudioDTO(TTSAudio a) {
        TTSAudioGroup g = a.getGroup();
        POI poi = g != null ? g.getPoi() : null;
        var poiUser = poi != null ? poi.getUser() : null;

        return ResTTSAudioDTO.builder()
                .id(a.getId())
                .groupId(g != null ? g.getId() : null)
                .groupKey(g != null ? g.getGroupKey() : null)
                .languageCode(a.getLanguageCode())
                .text(a.getText())
                .translatedText(a.getTranslatedText())
                .voice(a.getVoice())
                .speed(a.getSpeed())
                .format(a.getFormat())
                .withoutFilter(a.getWithoutFilter())
                .fileName(a.getFileName())
                .s3Url(a.getS3Url())
                .fileSize(a.getFileSize())
                .mimeType(a.getMimeType())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                // Thông tin ẩm thực từ POI
                .foodName(poi != null ? poi.getFoodName() : null)
                .price(poi != null ? poi.getPrice() : null)
                .description(poi != null ? poi.getDescription() : null)
                .imageUrl(poi != null ? poi.getImageUrl() : null)
                // GPS từ POI
                .latitude(poi != null ? poi.getLatitude() : null)
                .longitude(poi != null ? poi.getLongitude() : null)
                .accuracy(poi != null ? poi.getAccuracy() : null)
                .triggerRadiusMeters(poi != null ? poi.getTriggerRadiusMeters() : null)
                .priority(poi != null ? poi.getPriority() : null)
                .originalText(g != null ? g.getOriginalText() : null)
                .originalVoice(g != null ? g.getOriginalVoice() : null)
                // user từ POI
                .userId(poiUser != null ? poiUser.getId() : null)
                .userEmail(poiUser != null ? poiUser.getEmail() : null)
                .userFullName(poiUser != null
                        ? (poiUser.getFirstName() + " " + poiUser.getLastName()).trim() : null)
                .userAvatar(poiUser != null ? poiUser.getAvatar() : null)
                .createdBy(g != null ? g.getCreatedBy() : null)
                .build();
    }

    private ResTTSAudioGroupDTO toGroupDTO(TTSAudioGroup g) {
        return ResTTSAudioGroupDTO.fromEntity(g);
    }

    // Immutable result holder cho audio đã synthesize
    private record AudioResult(int fileSize, String s3Url, String fileName, String mimeType) {
        AudioData toAudioData() {
            return AudioData.builder()
                    .fileName(fileName)
                    .s3Url(s3Url)
                    .fileSize((long) fileSize)
                    .mimeType(mimeType)
                    .build();
        }
        ResAudioDataDTO toDTO() {
            return ResAudioDataDTO.builder()
                    .fileName(fileName)
                    .s3Url(s3Url)
                    .fileSize((long) fileSize)
                    .mimeType(mimeType)
                    .build();
        }
    }
}

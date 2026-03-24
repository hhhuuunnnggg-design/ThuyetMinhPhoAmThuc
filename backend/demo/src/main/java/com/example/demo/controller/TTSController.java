package com.example.demo.controller;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.domain.dto.ResultPaginationDTO;
import com.example.demo.domain.request.tts.ReqTTSDTO;
import com.example.demo.domain.request.tts.ReqUpdateTTSAudioGroupDTO;
import com.example.demo.domain.response.tts.ResAudioDataDTO;
import com.example.demo.domain.response.tts.ResTTSAudioDTO;
import com.example.demo.domain.response.tts.ResTTSAudioGroupDTO;
import com.example.demo.domain.response.tts.ResVoiceDTO;
import com.example.demo.domain.response.tts.ResVoicesDTO;
import com.example.demo.service.LocalStorageService;
import com.example.demo.service.TTSAudioService;
import com.example.demo.service.TTSService;
import com.example.demo.util.SecurityUtil;
import com.example.demo.util.annotation.ApiMessage;
import com.example.demo.util.error.IdInvalidException;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/tts")
public class TTSController {

    private final TTSService ttsService;
    private final TTSAudioService ttsAudioService;
    private final LocalStorageService localStorageService;

    public TTSController(TTSService ttsService, TTSAudioService ttsAudioService,
            LocalStorageService localStorageService) {
        this.ttsService = ttsService;
        this.ttsAudioService = ttsAudioService;
        this.localStorageService = localStorageService;
    }

    // ============ TTS cơ bản ============

    @PostMapping("/synthesize")
    @ApiMessage("Chuyển đổi text thành speech")
    public ResponseEntity<Resource> synthesizeSpeech(@Valid @RequestBody ReqTTSDTO request) throws IOException {
        return ttsService.synthesizeSpeech(request);
    }

    @GetMapping("/voices")
    @ApiMessage("Lấy danh sách giọng đọc có sẵn")
    public ResponseEntity<ResVoicesDTO> getAvailableVoices() throws IOException {
        ResVoiceDTO[] voicesArray = ttsService.getAvailableVoices();
        List<ResVoiceDTO> voicesList = Arrays.asList(voicesArray);
        ResVoicesDTO voicesData = new ResVoicesDTO(voicesList);
        return ResponseEntity.ok(voicesData);
    }

    // ============ TTSAudio — chỉ READ ============

    @GetMapping("/audios/{id}")
    @ApiMessage("Lấy TTS audio theo ID")
    public ResponseEntity<ResTTSAudioDTO> getTTSAudioById(@PathVariable Long id) throws IdInvalidException {
        ResTTSAudioDTO dto = ttsAudioService.getTTSAudioById(id);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/audios/{id}/download")
    @ApiMessage("Tải xuống hoặc phát TTS audio theo ID")
    public ResponseEntity<Resource> downloadTTSAudio(@PathVariable Long id) throws IdInvalidException {
        ResTTSAudioDTO dto = ttsAudioService.getTTSAudioById(id);
        if (dto.getGroupKey() == null) {
            throw new IdInvalidException("Audio này không thuộc group nào");
        }
        String langCode = dto.getLanguageCode() != null ? dto.getLanguageCode() : "vi";
        Resource resource = ttsAudioService.getAudioResource(dto.getGroupKey(), langCode);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("audio/mpeg"));
        String fileName = langCode + ".mp3";
        try {
            String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8).replace("+", "%20");
            String asciiFileName = fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
            String contentDisposition = String.format("inline; filename=\"%s\"; filename*=UTF-8''%s",
                    asciiFileName, encodedFileName);
            headers.set("Content-Disposition", contentDisposition);
        } catch (Exception e) {
            headers.setContentDispositionFormData("inline", fileName.replaceAll("[^a-zA-Z0-9._-]", "_"));
        }
        return ResponseEntity.ok().headers(headers).body(resource);
    }

    @GetMapping("/audios")
    @ApiMessage("Lấy danh sách TTS audios (phân trang)")
    public ResponseEntity<ResultPaginationDTO> getAllTTSAudios(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page - 1, size);
        Page<ResTTSAudioDTO> result = ttsAudioService.getAllTTSAudios(pageable);

        ResultPaginationDTO response = new ResultPaginationDTO();
        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        meta.setPage(result.getNumber() + 1);
        meta.setPageSize(result.getSize());
        meta.setPages(result.getTotalPages());
        meta.setTotal(result.getTotalElements());
        response.setMeta(meta);
        response.setResult(result.getContent());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/audios/{id}/stream")
    @ApiMessage("Phát audio theo audio ID + ngôn ngữ")
    public ResponseEntity<Resource> streamAudio(
            @PathVariable Long id,
            @RequestParam String languageCode) throws IdInvalidException {
        ResTTSAudioDTO dto = ttsAudioService.getTTSAudioById(id);
        if (dto.getGroupKey() == null) {
            throw new IdInvalidException("Audio này không thuộc group nào");
        }
        Resource resource = ttsAudioService.getAudioResource(dto.getGroupKey(), languageCode);
        return ResponseEntity.ok(resource);
    }

    // ============ Group CRUD ============

    /**
     * Tạo mới nhóm audio TTS: lưu metadata (tọa độ, ảnh, món ăn) + tạo audio đa
     * ngôn ngữ.
     */
    @PostMapping("/groups")
    @ApiMessage("Tạo mới nhóm audio TTS (kèm tạo audio đa ngôn ngữ)")
    public ResponseEntity<ResTTSAudioGroupDTO> createGroup(@Valid @RequestBody ReqTTSDTO request)
            throws IOException, IdInvalidException {
        String createdBy = SecurityUtil.getCurrentUserLogin().orElse("anonymous");
        request.setCreatedBy(createdBy);
        ResTTSAudioGroupDTO created = ttsAudioService.createGroup(request);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/groups/{id}")
    @ApiMessage("Lấy group audio theo ID")
    public ResponseEntity<ResTTSAudioGroupDTO> getGroupById(@PathVariable Long id) throws IdInvalidException {
        ResTTSAudioGroupDTO dto = ttsAudioService.getGroupById(id);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/groups/key/{groupKey}")
    @ApiMessage("Lấy group audio theo groupKey")
    public ResponseEntity<ResTTSAudioGroupDTO> getGroupByKey(@PathVariable String groupKey) throws IdInvalidException {
        ResTTSAudioGroupDTO dto = ttsAudioService.getGroupByKey(groupKey);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/groups")
    @ApiMessage("Lấy danh sách tất cả groups (phân trang)")
    public ResponseEntity<ResultPaginationDTO> getAllGroups(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page - 1, size);
        Page<ResTTSAudioGroupDTO> result = ttsAudioService.getAllGroups(pageable);

        ResultPaginationDTO response = new ResultPaginationDTO();
        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        meta.setPage(result.getNumber() + 1);
        meta.setPageSize(result.getSize());
        meta.setPages(result.getTotalPages());
        meta.setTotal(result.getTotalElements());
        response.setMeta(meta);
        response.setResult(result.getContent());

        return ResponseEntity.ok(response);
    }

    @PutMapping("/groups/{id}")
    @ApiMessage("Cập nhật metadata nhóm audio TTS (món ăn, GPS, text/voice gốc)")
    public ResponseEntity<ResTTSAudioGroupDTO> updateGroup(
            @PathVariable Long id,
            @Valid @RequestBody ReqUpdateTTSAudioGroupDTO request) throws IdInvalidException {
        ResTTSAudioGroupDTO updated = ttsAudioService.updateGroup(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/groups/{id}")
    @ApiMessage("Xóa group audio và tất cả audio trong group")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long id) throws IOException, IdInvalidException {
        ttsAudioService.deleteGroup(id);
        return ResponseEntity.ok().build();
    }

    // ============ Audio file — phát / download ============

    /**
     * Phát hoặc download audio theo groupKey + ngôn ngữ.
     */
    @GetMapping("/groups/{groupKey}/audio/{languageCode}")
    @ApiMessage("Phát/download audio theo groupKey và ngôn ngữ")
    public ResponseEntity<Resource> getAudio(
            @PathVariable String groupKey,
            @PathVariable String languageCode,
            @RequestParam(defaultValue = "inline") String disposition) throws IdInvalidException {

        Resource resource = ttsAudioService.getAudioResource(groupKey, languageCode);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("audio/mpeg"));

        String fileName = languageCode + ".mp3";
        String encodedFileName;
        try {
            encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8).replace("+", "%20");
            String asciiFileName = fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
            String contentDisposition = String.format("%s; filename=\"%s\"; filename*=UTF-8''%s",
                    disposition, asciiFileName, encodedFileName);
            headers.set("Content-Disposition", contentDisposition);
        } catch (Exception e) {
            headers.setContentDispositionFormData("inline", fileName.replaceAll("[^a-zA-Z0-9._-]", "_"));
        }

        return ResponseEntity.ok()
                .headers(headers)
                .body(resource);
    }

    /**
     * Tạo audio đa ngôn ngữ cho group (bổ sung ngôn ngữ chưa có).
     */
    @PostMapping("/groups/{id}/generate-multilingual")
    @ApiMessage("Tạo audio đa ngôn ngữ cho group (bổ sung ngôn ngữ chưa có)")
    public ResponseEntity<Map<String, ResAudioDataDTO>> generateMultilingualForGroup(@PathVariable Long id)
            throws IOException, IdInvalidException {
        Map<String, ResAudioDataDTO> result = ttsAudioService.generateMultilingualAudio(id);
        return ResponseEntity.ok(result);
    }

    // ============ Images ============

    @PostMapping("/images/upload")
    @ApiMessage("Upload ảnh món ăn")
    public ResponseEntity<java.util.Map<String, String>> uploadImage(
            @RequestParam("image") MultipartFile imageFile) throws IOException, IdInvalidException {

        if (imageFile.isEmpty()) {
            throw new IdInvalidException("File ảnh không được để trống");
        }

        String contentType = imageFile.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IdInvalidException("File phải là ảnh (image/*)");
        }

        String imageUrl;
        try {
            imageUrl = localStorageService.uploadFile(imageFile, "food-images");
        } catch (Exception e) {
            throw new IdInvalidException("Upload ảnh thất bại: " + e.getMessage());
        }

        Map<String, String> response = new HashMap<>();
        response.put("imageUrl", imageUrl);
        response.put("message", "Upload ảnh thành công");

        return ResponseEntity.ok(response);
    }
}
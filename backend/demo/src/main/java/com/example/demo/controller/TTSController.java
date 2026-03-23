package com.example.demo.controller;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpHeaders;
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

import com.example.demo.domain.TTSAudio;
import com.example.demo.domain.dto.ResultPaginationDTO;
import com.example.demo.domain.request.tts.ReqTTSDTO;
import com.example.demo.domain.response.tts.ResMultilingualAudioDTO;
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
import com.turkraft.springfilter.boot.Filter;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/tts")
public class TTSController {

    private final TTSService ttsService;
    private final TTSAudioService ttsAudioService;
    private final LocalStorageService localStorageService;

    public TTSController(TTSService ttsService, TTSAudioService ttsAudioService, LocalStorageService localStorageService) {
        this.ttsService = ttsService;
        this.ttsAudioService = ttsAudioService;
        this.localStorageService = localStorageService;
    }

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

        // Trả về ResVoicesDTO trực tiếp, FormarRestResponse sẽ tự động wrap thành
        // RestResponse
        return ResponseEntity.ok(voicesData);
    }

    @PostMapping("/synthesize-and-save")
    @ApiMessage("Tạo và lưu audio thành công")
    public ResponseEntity<ResTTSAudioDTO> synthesizeAndSave(@Valid @RequestBody ReqTTSDTO request)
            throws IOException, IdInvalidException {
        // Lấy email của user hiện tại
        String createdBy = SecurityUtil.getCurrentUserLogin().orElse("anonymous");
        request.setCreatedBy(createdBy);

        // Tạo audio tiếng Việt
        ResponseEntity<Resource> audioResponse = ttsService.synthesizeSpeech(request);
        Resource resource = audioResponse.getBody();

        if (resource == null) {
            throw new IdInvalidException("Không thể tạo audio");
        }

        byte[] audioData;
        try (var inputStream = resource.getInputStream()) {
            audioData = inputStream.readAllBytes();
        }

        // Tạo tên file
        String fileName = generateFileName(request);

        // Lưu file và database
        TTSAudio ttsAudio = ttsAudioService.createTTSAudio(request, audioData, fileName, createdBy);

        // Nếu có flag multilingual=true → tự động tạo thêm audio đa ngôn ngữ
        if (Boolean.TRUE.equals(request.getMultilingual())) {
            System.out.println("🌐 Multilingual flag = true → Tạo audio đa ngôn ngữ...");
            try {
                ResMultilingualAudioDTO multilingualResult = ttsAudioService.createMultilingualForExisting(ttsAudio, request);
                System.out.println("✅ Đã tạo " + multilingualResult.getAudios().size() + " audio đa ngôn ngữ cho group: " + multilingualResult.getGroupId());
            } catch (Exception e) {
                System.err.println("⚠️  Không thể tạo audio đa ngôn ngữ: " + e.getMessage());
            }
        }

        ResTTSAudioDTO dto = convertToDTO(ttsAudio);

        // Log thông tin file đã tạo
        System.out.println("========================================");
        System.out.println("📝 TTS AUDIO ĐÃ ĐƯỢC TẠO!");
        System.out.println("🆔 ID: " + dto.getId());
        System.out.println("📄 File Name: " + dto.getFileName());
        if (dto.getS3Url() != null) {
            System.out.println("🔗 URL: " + dto.getS3Url());
        } else {
            System.out.println("⚠️  URL: null (chưa lưu file)");
        }
        System.out.println("📊 File Size: " + dto.getFileSize() + " bytes");
        System.out.println("========================================");

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/audios")
    @ApiMessage("Lấy danh sách TTS audios")
    public ResponseEntity<ResultPaginationDTO> getAllTTSAudios(
            @Filter Specification<TTSAudio> spec,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page - 1, size);
        Page<ResTTSAudioDTO> result = ttsAudioService.getAllTTSAudios(spec, pageable);

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

    // ============ Multi-language ============
    @PostMapping("/multilingual")
    @ApiMessage("Tạo audio đa ngôn ngữ (EN, ZH, JA, KO, FR) từ text tiếng Việt")
    public ResponseEntity<ResMultilingualAudioDTO> createMultilingualAudio(@Valid @RequestBody ReqTTSDTO request)
            throws IOException, IdInvalidException {
        String createdBy = SecurityUtil.getCurrentUserLogin().orElse("anonymous");
        request.setCreatedBy(createdBy);

        ResMultilingualAudioDTO result = ttsAudioService.createMultilingualAudio(request);

        System.out.println("========================================");
        System.out.println("✅ MULTILINGUAL AUDIO CREATED!");
        System.out.println("📁 Group Key: " + result.getGroupId());
        System.out.println("🌐 Languages: " + result.getAudios().size());
        for (ResMultilingualAudioDTO.AudioEntry entry : result.getAudios()) {
            System.out.println("   - " + entry.getLanguageName() + " (" + entry.getLanguageCode() + "): " + entry.getS3Url());
        }
        System.out.println("========================================");

        return ResponseEntity.ok(result);
    }

    /**
     * Generate multilingual audio cho một audio đã tồn tại.
     * Dùng để tạo audio đa ngôn ngữ cho các audio cũ chưa có.
     */
    @PostMapping("/audios/{id}/generate-multilingual")
    @ApiMessage("Tạo audio đa ngôn ngữ cho audio đã tồn tại")
    public ResponseEntity<ResMultilingualAudioDTO> generateMultilingualForAudio(@PathVariable Long id)
            throws IdInvalidException {
        TTSAudio viAudio = ttsAudioService.getTTSAudioById(id);

        // Build request từ audio hiện tại
        ReqTTSDTO request = new ReqTTSDTO();
        request.setText(viAudio.getText());
        request.setVoice(viAudio.getVoice());
        request.setSpeed(viAudio.getSpeed());
        request.setTtsReturnOption(viAudio.getFormat());
        request.setWithoutFilter(viAudio.getWithoutFilter());
        request.setFoodName(viAudio.getFoodName());
        request.setPrice(viAudio.getPrice());
        request.setDescription(viAudio.getDescription());
        request.setImageUrl(viAudio.getImageUrl());
        request.setLatitude(viAudio.getLatitude());
        request.setLongitude(viAudio.getLongitude());
        request.setAccuracy(viAudio.getAccuracy());
        request.setTriggerRadiusMeters(viAudio.getTriggerRadiusMeters());
        request.setPriority(viAudio.getPriority());
        request.setCreatedBy(viAudio.getCreatedBy());

        ResMultilingualAudioDTO result = ttsAudioService.createMultilingualForExisting(viAudio, request);

        System.out.println("========================================");
        System.out.println("✅ MULTILINGUAL AUDIO GENERATED FOR EXISTING!");
        System.out.println("📁 Audio ID: " + id);
        System.out.println("📁 Group Key: " + result.getGroupId());
        System.out.println("🌐 Languages: " + result.getAudios().size());
        for (ResMultilingualAudioDTO.AudioEntry entry : result.getAudios()) {
            System.out.println("   - " + entry.getLanguageName() + " (" + entry.getLanguageCode() + "): " + entry.getS3Url());
        }
        System.out.println("========================================");

        return ResponseEntity.ok(result);
    }

    @GetMapping("/groups/{id}")
    @ApiMessage("Lấy group audio theo ID")
    public ResponseEntity<ResTTSAudioGroupDTO> getGroupById(@PathVariable Long id) throws IdInvalidException {
        ResTTSAudioGroupDTO group = ttsAudioService.getGroupById(id);
        return ResponseEntity.ok(group);
    }

    @GetMapping("/groups/key/{groupKey}")
    @ApiMessage("Lấy group audio theo groupKey")
    public ResponseEntity<ResTTSAudioGroupDTO> getGroupByKey(@PathVariable String groupKey) throws IdInvalidException {
        ResTTSAudioGroupDTO group = ttsAudioService.getGroupByKey(groupKey);
        return ResponseEntity.ok(group);
    }

    @GetMapping("/audios/my")
    @ApiMessage("Lấy danh sách TTS audios của user hiện tại")
    public ResponseEntity<List<ResTTSAudioDTO>> getMyTTSAudios() throws IdInvalidException {
        String createdBy = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new IdInvalidException("Người dùng chưa đăng nhập"));

        List<ResTTSAudioDTO> audios = ttsAudioService.getTTSAudiosByUser(createdBy);

        // Trả về List trực tiếp, FormarRestResponse sẽ tự động wrap thành RestResponse
        return ResponseEntity.ok(audios);
    }

    @GetMapping("/audios/{id}")
    @ApiMessage("Lấy TTS audio theo ID")
    public ResponseEntity<ResTTSAudioDTO> getTTSAudioById(@PathVariable Long id)
            throws IdInvalidException {
        TTSAudio ttsAudio = ttsAudioService.getTTSAudioById(id);
        ResTTSAudioDTO dto = convertToDTO(ttsAudio);

        // Trả về ResTTSAudioDTO trực tiếp, FormarRestResponse sẽ tự động wrap thành
        // RestResponse
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/audios/{id}/download")
    @ApiMessage("Tải xuống hoặc phát TTS audio")
    public ResponseEntity<Resource> downloadTTSAudio(@PathVariable Long id)
            throws IOException, IdInvalidException {
        TTSAudio ttsAudio = ttsAudioService.getTTSAudioById(id);

        // Nếu có file URL, serve file từ local storage
        if (ttsAudio.getS3Url() != null && !ttsAudio.getS3Url().isEmpty()) {
            try {
                Resource resource = ttsAudioService.getAudioResourceFromS3(ttsAudio.getFileName());
                if (resource != null && resource.exists()) {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(org.springframework.http.MediaType.parseMediaType(ttsAudio.getMimeType()));
                    headers.setContentLength(ttsAudio.getFileSize());

                    // Encode filename
                    String fileName = ttsAudio.getFileName();
                    String actualFileName = fileName.contains("/")
                            ? fileName.substring(fileName.lastIndexOf("/") + 1)
                            : fileName;
                    try {
                        String encodedFileName = java.net.URLEncoder
                                .encode(actualFileName, java.nio.charset.StandardCharsets.UTF_8)
                                .replace("+", "%20");
                        String asciiFileName = actualFileName.replaceAll("[^a-zA-Z0-9._-]", "_");
                        String contentDisposition = String.format("inline; filename=\"%s\"; filename*=UTF-8''%s",
                                asciiFileName, encodedFileName);
                        headers.set("Content-Disposition", contentDisposition);
                    } catch (Exception e) {
                        String safeFileName = actualFileName.replaceAll("[^a-zA-Z0-9._-]", "_");
                        headers.setContentDispositionFormData("inline", safeFileName);
                    }

                    return ResponseEntity.ok()
                            .headers(headers)
                            .body(resource);
                }
            } catch (Exception e) {
                System.err.println("WARNING: Không thể lấy file: " + e.getMessage());
            }
        }

        // Nếu không có file URL, regenerate audio từ metadata
        ReqTTSDTO request = new ReqTTSDTO();
        request.setText(ttsAudio.getText());
        request.setVoice(ttsAudio.getVoice());
        request.setSpeed(ttsAudio.getSpeed());
        request.setTtsReturnOption(ttsAudio.getFormat());
        request.setWithoutFilter(ttsAudio.getWithoutFilter());

        // Tạo lại audio
        ResponseEntity<Resource> audioResponse = ttsService.synthesizeSpeech(request);
        Resource resource = audioResponse.getBody();

        if (resource == null) {
            throw new IdInvalidException("Không thể tạo lại audio");
        }

        // Set headers
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.parseMediaType(ttsAudio.getMimeType()));
        headers.setContentLength(ttsAudio.getFileSize());

        // Encode filename để tránh lỗi Unicode trong Content-Disposition header
        String fileName = ttsAudio.getFileName();
        // Lấy tên file từ path (nếu có folder prefix)
        String actualFileName = fileName.contains("/")
                ? fileName.substring(fileName.lastIndexOf("/") + 1)
                : fileName;

        // Encode filename theo RFC 5987 để hỗ trợ Unicode
        // Sử dụng filename* với UTF-8 encoding
        try {
            String encodedFileName = java.net.URLEncoder.encode(actualFileName, java.nio.charset.StandardCharsets.UTF_8)
                    .replace("+", "%20");
            // Tạo ASCII-safe filename cho fallback
            String asciiFileName = actualFileName.replaceAll("[^a-zA-Z0-9._-]", "_");
            String contentDisposition = String.format("attachment; filename=\"%s\"; filename*=UTF-8''%s",
                    asciiFileName, encodedFileName);
            headers.set("Content-Disposition", contentDisposition);
        } catch (Exception e) {
            // Fallback: chỉ dùng ASCII filename nếu encode thất bại
            String safeFileName = actualFileName.replaceAll("[^a-zA-Z0-9._-]", "_");
            headers.setContentDispositionFormData("attachment", safeFileName);
        }

        return ResponseEntity.ok()
                .headers(headers)
                .body(resource);
    }

    @PutMapping("/audios/{id}")
    @ApiMessage("Cập nhật TTS audio")
    public ResponseEntity<ResTTSAudioDTO> updateTTSAudio(
            @PathVariable Long id,
            @Valid @RequestBody ReqTTSDTO request) throws IOException, IdInvalidException {

        // Lấy audio hiện tại để kiểm tra có thay đổi không
        TTSAudio existingAudio = ttsAudioService.getTTSAudioById(id);

        // Kiểm tra xem có thay đổi gì không (text, voice, speed, format, withoutFilter)
        boolean needsRegenerate = !existingAudio.getText().equals(request.getText()) ||
                !existingAudio.getVoice().equals(request.getVoice()) ||
                !existingAudio.getSpeed().equals(request.getSpeed()) ||
                !existingAudio.getFormat().equals(request.getTtsReturnOption()) ||
                !existingAudio.getWithoutFilter().equals(request.getWithoutFilter());

        // Nếu có thay đổi, regenerate audio mới và lưu vào local storage
        if (needsRegenerate) {
            // Tạo audio mới từ text mới
            ResponseEntity<Resource> audioResponse = ttsService.synthesizeSpeech(request);
            Resource resource = audioResponse.getBody();

            if (resource == null) {
                throw new IdInvalidException("Không thể tạo audio mới");
            }

            byte[] audioData;
            try (var inputStream = resource.getInputStream()) {
                audioData = inputStream.readAllBytes();
            }

            // Tạo tên file mới
            String fileName = generateFileName(request);

            // Xóa file cũ nếu có
            if (existingAudio.getS3Url() != null && existingAudio.getFileName() != null) {
                try {
                    ttsAudioService.deleteTTSAudioFileFromS3(existingAudio.getFileName());
                    System.out.println("✅ Đã xóa file cũ: " + existingAudio.getFileName());
                } catch (Exception e) {
                    System.err.println("⚠️  Không thể xóa file cũ: " + e.getMessage());
                }
            }

            // Lưu file mới và cập nhật metadata
            TTSAudio updatedAudio = ttsAudioService.updateTTSAudioWithNewFile(id, request, audioData, fileName);
            ResTTSAudioDTO dto = convertToDTO(updatedAudio);

            System.out.println("========================================");
            System.out.println("✅ TTS AUDIO ĐÃ ĐƯỢC CẬP NHẬT!");
            System.out.println("🆔 ID: " + dto.getId());
            System.out.println("📄 File Name mới: " + dto.getFileName());
            if (dto.getS3Url() != null) {
                System.out.println("🔗 URL mới: " + dto.getS3Url());
            }
            System.out.println("========================================");

            return ResponseEntity.ok(dto);
        } else {
            // Không có thay đổi, chỉ cập nhật metadata
            TTSAudio ttsAudio = ttsAudioService.updateTTSAudio(id, request);
            ResTTSAudioDTO dto = convertToDTO(ttsAudio);
            return ResponseEntity.ok(dto);
        }
    }

    @DeleteMapping("/audios/{id}")
    @ApiMessage("Xóa TTS audio")
    public ResponseEntity<Void> deleteTTSAudio(@PathVariable Long id)
            throws IOException, IdInvalidException {
        ttsAudioService.deleteTTSAudio(id);

        // Trả về Void (204 No Content) hoặc có thể trả về message
        // FormarRestResponse sẽ tự động wrap thành RestResponse với message từ
        // @ApiMessage
        return ResponseEntity.ok().build();
    }

    @PostMapping("/audios/{id}/image")
    @ApiMessage("Upload ảnh món ăn")
    public ResponseEntity<ResTTSAudioDTO> uploadFoodImage(
            @PathVariable Long id,
            @RequestParam("image") MultipartFile imageFile)
            throws IOException, IdInvalidException {

        // Validate file
        if (imageFile.isEmpty()) {
            throw new IdInvalidException("File ảnh không được để trống");
        }

        // Validate file type
        String contentType = imageFile.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IdInvalidException("File phải là ảnh (image/*)");
        }

        // Get audio
        TTSAudio ttsAudio = ttsAudioService.getTTSAudioById(id);

        // Delete old image if exists
        if (ttsAudio.getImageUrl() != null && !ttsAudio.getImageUrl().isEmpty()) {
            try {
                localStorageService.deleteFile(ttsAudio.getImageUrl());
                System.out.println("✅ Đã xóa ảnh cũ: " + ttsAudio.getImageUrl());
            } catch (Exception e) {
                System.err.println("⚠️  Không thể xóa ảnh cũ: " + e.getMessage());
            }
        }

        // Upload new image
        String imageUrl;
        try {
            imageUrl = localStorageService.uploadFile(imageFile, "food-images");
            System.out.println("✅ Đã lưu ảnh: " + imageUrl);
        } catch (Exception e) {
            throw new IOException("Không thể lưu ảnh: " + e.getMessage(), e);
        }

        // Update imageUrl in database
        ReqTTSDTO updateRequest = new ReqTTSDTO();
        updateRequest.setText(ttsAudio.getText());
        updateRequest.setVoice(ttsAudio.getVoice());
        updateRequest.setSpeed(ttsAudio.getSpeed());
        updateRequest.setTtsReturnOption(ttsAudio.getFormat());
        updateRequest.setWithoutFilter(ttsAudio.getWithoutFilter());
        updateRequest.setFoodName(ttsAudio.getFoodName());
        updateRequest.setPrice(ttsAudio.getPrice());
        updateRequest.setDescription(ttsAudio.getDescription());
        updateRequest.setImageUrl(imageUrl);
        updateRequest.setLatitude(ttsAudio.getLatitude());
        updateRequest.setLongitude(ttsAudio.getLongitude());
        updateRequest.setAccuracy(ttsAudio.getAccuracy());
        updateRequest.setTriggerRadiusMeters(ttsAudio.getTriggerRadiusMeters());
        updateRequest.setPriority(ttsAudio.getPriority());

        TTSAudio updatedAudio = ttsAudioService.updateTTSAudio(id, updateRequest);
        ResTTSAudioDTO dto = convertToDTO(updatedAudio);

        System.out.println("========================================");
        System.out.println("✅ ẢNH MÓN ĂN ĐÃ ĐƯỢC UPLOAD!");
        System.out.println("🆔 Audio ID: " + dto.getId());
        System.out.println("🖼️  Image URL: " + dto.getImageUrl());
        System.out.println("========================================");

        return ResponseEntity.ok(dto);
    }

    @PostMapping("/images/upload")
    @ApiMessage("Upload ảnh món ăn (không cần audio ID)")
    public ResponseEntity<java.util.Map<String, String>> uploadFoodImageOnly(
            @RequestParam("image") MultipartFile imageFile)
            throws IOException, IdInvalidException {

        // Validate file
        if (imageFile.isEmpty()) {
            throw new IdInvalidException("File ảnh không được để trống");
        }

        // Validate file type
        String contentType = imageFile.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IdInvalidException("File phải là ảnh (image/*)");
        }

        // Upload image
        String imageUrl;
        try {
            imageUrl = localStorageService.uploadFile(imageFile, "food-images");
            System.out.println("✅ Đã lưu ảnh: " + imageUrl);
        } catch (Exception e) {
            throw new IOException("Không thể lưu ảnh: " + e.getMessage(), e);
        }

        java.util.Map<String, String> response = new java.util.HashMap<>();
        response.put("imageUrl", imageUrl);
        response.put("message", "Upload ảnh thành công");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/images/{fileName:.+}")
    @ApiMessage("Lấy ảnh từ local storage")
    public ResponseEntity<Resource> getFoodImage(@PathVariable String fileName)
            throws IOException {

        // Decode fileName nếu có encoding
        String decodedFileName = java.net.URLDecoder.decode(fileName, java.nio.charset.StandardCharsets.UTF_8);

        try {
            Resource resource = ttsAudioService.getImageResourceFromS3(decodedFileName);
            if (resource == null || !resource.exists()) {
                throw new IOException("Không tìm thấy ảnh: " + decodedFileName);
            }

            // Determine content type from file extension
            String contentType = "image/jpeg";
            String lowerPath = decodedFileName.toLowerCase();
            if (lowerPath.endsWith(".png")) {
                contentType = "image/png";
            } else if (lowerPath.endsWith(".gif")) {
                contentType = "image/gif";
            } else if (lowerPath.endsWith(".webp")) {
                contentType = "image/webp";
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.parseMediaType(contentType));
            headers.setCacheControl("public, max-age=31536000"); // Cache 1 year

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);
        } catch (Exception e) {
            throw new IOException("Không tìm thấy ảnh: " + decodedFileName + " - " + e.getMessage());
        }
    }

    // Helper methods
    private String generateFileName(ReqTTSDTO request) {
        String textPreview = request.getText()
                .substring(0, Math.min(30, request.getText().length()))
                .replaceAll("[^a-zA-Z0-9\\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]", "")
                .replaceAll("\\s+", "-")
                .toLowerCase()
                .trim();

        String voiceName = request.getVoice().split("-").length > 1
                ? request.getVoice().split("-")[request.getVoice().split("-").length - 1]
                : request.getVoice();

        String timestamp = String.valueOf(System.currentTimeMillis());
        String ext = request.getTtsReturnOption() == 2 ? "wav" : "mp3";

        return String.format("%s-%s-%s.%s", textPreview, voiceName, timestamp, ext);
    }

    private ResTTSAudioDTO convertToDTO(TTSAudio ttsAudio) {
        String imageUrl = ttsAudio.getImageUrl();

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
                .imageUrl(imageUrl)
                .latitude(ttsAudio.getLatitude())
                .longitude(ttsAudio.getLongitude())
                .accuracy(ttsAudio.getAccuracy())
                .build();
    }
}

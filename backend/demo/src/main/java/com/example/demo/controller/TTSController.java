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
import com.example.demo.domain.response.tts.ResTTSAudioDTO;
import com.example.demo.domain.response.tts.ResVoiceDTO;
import com.example.demo.domain.response.tts.ResVoicesDTO;
import com.example.demo.service.S3Service;
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
    private final S3Service s3Service;

    public TTSController(TTSService ttsService, TTSAudioService ttsAudioService, S3Service s3Service) {
        this.ttsService = ttsService;
        this.ttsAudioService = ttsAudioService;
        this.s3Service = s3Service;
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
        // Tạo audio
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

        // Lấy email của user hiện tại
        String createdBy = SecurityUtil.getCurrentUserLogin().orElse("anonymous");

        // Lưu lên S3 và database
        TTSAudio ttsAudio = ttsAudioService.createTTSAudio(request, audioData, fileName, createdBy);

        ResTTSAudioDTO dto = convertToDTO(ttsAudio);

        // Log thông tin file đã tạo
        System.out.println("========================================");
        System.out.println("📝 TTS AUDIO ĐÃ ĐƯỢC TẠO!");
        System.out.println("🆔 ID: " + dto.getId());
        System.out.println("📄 File Name: " + dto.getFileName());
        if (dto.getS3Url() != null) {
            System.out.println("🔗 S3 URL: " + dto.getS3Url());
        } else {
            System.out.println("⚠️  S3 URL: null (chưa upload lên S3)");
        }
        System.out.println("📊 File Size: " + dto.getFileSize() + " bytes");
        System.out.println("========================================");

        // Trả về ResTTSAudioDTO trực tiếp, FormarRestResponse sẽ tự động wrap thành
        // RestResponse
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

        // Nếu có S3 URL, serve file từ S3 thông qua backend (tránh Access Denied)
        if (ttsAudio.getS3Url() != null && !ttsAudio.getS3Url().isEmpty()) {
            try {
                // Lấy file từ S3 thông qua S3Service
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
                // Nếu không lấy được từ S3, fallback về regenerate
                System.err.println("WARNING: Không thể lấy file từ S3: " + e.getMessage());
            }
        }

        // Nếu không có S3 URL, regenerate audio từ metadata
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

        // Nếu có thay đổi, regenerate audio mới và upload lên S3
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

            // Xóa file cũ trên S3 nếu có
            if (existingAudio.getS3Url() != null && existingAudio.getFileName() != null) {
                try {
                    ttsAudioService.deleteTTSAudioFileFromS3(existingAudio.getFileName());
                    System.out.println("✅ Đã xóa file cũ trên S3: " + existingAudio.getFileName());
                } catch (Exception e) {
                    System.err.println("⚠️  Không thể xóa file cũ trên S3: " + e.getMessage());
                }
            }

            // Upload file mới lên S3 và cập nhật metadata
            TTSAudio updatedAudio = ttsAudioService.updateTTSAudioWithNewFile(id, request, audioData, fileName);
            ResTTSAudioDTO dto = convertToDTO(updatedAudio);

            System.out.println("========================================");
            System.out.println("✅ TTS AUDIO ĐÃ ĐƯỢC CẬP NHẬT!");
            System.out.println("🆔 ID: " + dto.getId());
            System.out.println("📄 File Name mới: " + dto.getFileName());
            if (dto.getS3Url() != null) {
                System.out.println("🔗 S3 URL mới: " + dto.getS3Url());
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
    @ApiMessage("Upload ảnh món ăn lên S3")
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

        // Delete old image from S3 if exists
        if (ttsAudio.getImageUrl() != null && !ttsAudio.getImageUrl().isEmpty()) {
            try {
                // Extract file name from URL (handle cả URL có region và không có region)
                String oldFileName = ttsAudio.getImageUrl();
                // Pattern: https://bucket.s3.region.amazonaws.com/food-images/file.jpg
                // hoặc: https://bucket.s3.amazonaws.com/food-images/file.jpg
                if (oldFileName.contains("food-images/")) {
                    oldFileName = oldFileName.substring(oldFileName.indexOf("food-images/"));
                    s3Service.deleteFile(oldFileName);
                    System.out.println("✅ Đã xóa ảnh cũ trên S3: " + oldFileName);
                }
            } catch (Exception e) {
                System.err.println("⚠️  Không thể xóa ảnh cũ trên S3: " + e.getMessage());
            }
        }

        // Upload new image to S3
        String imageUrl;
        try {
            imageUrl = s3Service.uploadFile(imageFile, "food-images");
            System.out.println("✅ Đã upload ảnh lên S3: " + imageUrl);
        } catch (Exception e) {
            throw new IOException("Không thể upload ảnh lên S3: " + e.getMessage(), e);
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
    @ApiMessage("Upload ảnh món ăn lên S3 (không cần audio ID)")
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

        // Upload image to S3
        String imageUrl;
        try {
            imageUrl = s3Service.uploadFile(imageFile, "food-images");
            System.out.println("✅ Đã upload ảnh lên S3: " + imageUrl);
        } catch (Exception e) {
            throw new IOException("Không thể upload ảnh lên S3: " + e.getMessage(), e);
        }

        java.util.Map<String, String> response = new java.util.HashMap<>();
        response.put("imageUrl", imageUrl);
        response.put("message", "Upload ảnh thành công");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/images/{fileName:.+}")
    @ApiMessage("Lấy ảnh từ S3")
    public ResponseEntity<Resource> getFoodImage(@PathVariable String fileName)
            throws IOException {

        // Decode fileName nếu có encoding
        String decodedFileName = java.net.URLDecoder.decode(fileName, java.nio.charset.StandardCharsets.UTF_8);

        // Try multiple paths để handle cả duplicate folder case
        String[] possiblePaths = {
                decodedFileName, // Path như user gửi
                decodedFileName.startsWith("food-images/") ? decodedFileName : "food-images/" + decodedFileName, // Thêm
                                                                                                                 // prefix
                                                                                                                 // nếu
                                                                                                                 // chưa
                                                                                                                 // có
                decodedFileName.startsWith("food-images/food-images/") ? decodedFileName
                        : "food-images/food-images/" + decodedFileName.replaceFirst("^food-images/", ""), // Handle
                                                                                                          // duplicate
                                                                                                          // folder
        };

        Resource resource = null;
        String foundPath = null;

        for (String path : possiblePaths) {
            try {
                resource = ttsAudioService.getImageResourceFromS3(path);
                if (resource != null && resource.exists()) {
                    foundPath = path;
                    break;
                }
            } catch (Exception e) {
                // Try next path
                continue;
            }
        }

        if (resource != null && resource.exists() && foundPath != null) {
            // Determine content type from file extension
            String contentType = "image/jpeg";
            String lowerPath = foundPath.toLowerCase();
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
        }

        throw new IOException("Không tìm thấy ảnh. Đã thử các path: " + String.join(", ", possiblePaths));
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
        // Giữ nguyên S3 URL (bucket đã public)
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

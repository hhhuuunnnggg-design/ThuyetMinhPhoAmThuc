package com.example.demo.controller;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
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

import com.example.demo.domain.TTSAudio;
import com.example.demo.domain.dto.ResultPaginationDTO;
import com.example.demo.domain.request.tts.ReqTTSDTO;
import com.example.demo.domain.response.RestResponse;
import com.example.demo.domain.response.tts.ResTTSAudioDTO;
import com.example.demo.domain.response.tts.ResVoiceDTO;
import com.example.demo.domain.response.tts.ResVoicesDTO;
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

    public TTSController(TTSService ttsService, TTSAudioService ttsAudioService) {
        this.ttsService = ttsService;
        this.ttsAudioService = ttsAudioService;
    }

    @PostMapping("/synthesize")
    @ApiMessage("Chuyển đổi text thành speech")
    public ResponseEntity<Resource> synthesizeSpeech(@Valid @RequestBody ReqTTSDTO request) throws IOException {
        return ttsService.synthesizeSpeech(request);
    }

    @GetMapping("/voices")
    @ApiMessage("Lấy danh sách giọng đọc có sẵn")
    public ResponseEntity<RestResponse<ResVoicesDTO>> getAvailableVoices() throws IOException {
        ResVoiceDTO[] voicesArray = ttsService.getAvailableVoices();
        List<ResVoiceDTO> voicesList = Arrays.asList(voicesArray);

        ResVoicesDTO voicesData = new ResVoicesDTO(voicesList);

        RestResponse<ResVoicesDTO> response = new RestResponse<>();
        response.setStatusCode(200);
        response.setError(null);
        response.setMessage("Lấy danh sách giọng đọc có sẵn");
        response.setData(voicesData);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/synthesize-and-save")
    @ApiMessage("Chuyển đổi text thành speech và lưu lên S3")
    public ResponseEntity<RestResponse<ResTTSAudioDTO>> synthesizeAndSave(@Valid @RequestBody ReqTTSDTO request)
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

        RestResponse<ResTTSAudioDTO> response = new RestResponse<>();
        response.setStatusCode(200);
        response.setError(null);
        response.setMessage("Tạo và lưu audio thành công");
        response.setData(dto);

        return ResponseEntity.ok(response);
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
    public ResponseEntity<RestResponse<List<ResTTSAudioDTO>>> getMyTTSAudios() throws IdInvalidException {
        String createdBy = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new IdInvalidException("Người dùng chưa đăng nhập"));

        List<ResTTSAudioDTO> audios = ttsAudioService.getTTSAudiosByUser(createdBy);

        RestResponse<List<ResTTSAudioDTO>> response = new RestResponse<>();
        response.setStatusCode(200);
        response.setError(null);
        response.setMessage("Lấy danh sách audio thành công");
        response.setData(audios);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/audios/{id}")
    @ApiMessage("Lấy TTS audio theo ID")
    public ResponseEntity<RestResponse<ResTTSAudioDTO>> getTTSAudioById(@PathVariable Long id)
            throws IdInvalidException {
        TTSAudio ttsAudio = ttsAudioService.getTTSAudioById(id);
        ResTTSAudioDTO dto = convertToDTO(ttsAudio);

        RestResponse<ResTTSAudioDTO> response = new RestResponse<>();
        response.setStatusCode(200);
        response.setError(null);
        response.setMessage("Lấy audio thành công");
        response.setData(dto);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/audios/{id}")
    @ApiMessage("Cập nhật TTS audio")
    public ResponseEntity<RestResponse<ResTTSAudioDTO>> updateTTSAudio(
            @PathVariable Long id,
            @Valid @RequestBody ReqTTSDTO request) throws IOException, IdInvalidException {
        TTSAudio ttsAudio = ttsAudioService.updateTTSAudio(id, request);
        ResTTSAudioDTO dto = convertToDTO(ttsAudio);

        RestResponse<ResTTSAudioDTO> response = new RestResponse<>();
        response.setStatusCode(200);
        response.setError(null);
        response.setMessage("Cập nhật audio thành công");
        response.setData(dto);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/audios/{id}")
    @ApiMessage("Xóa TTS audio")
    public ResponseEntity<RestResponse<Void>> deleteTTSAudio(@PathVariable Long id)
            throws IOException, IdInvalidException {
        ttsAudioService.deleteTTSAudio(id);

        RestResponse<Void> response = new RestResponse<>();
        response.setStatusCode(200);
        response.setError(null);
        response.setMessage("Xóa audio thành công");
        response.setData(null);

        return ResponseEntity.ok(response);
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
                .build();
    }
}

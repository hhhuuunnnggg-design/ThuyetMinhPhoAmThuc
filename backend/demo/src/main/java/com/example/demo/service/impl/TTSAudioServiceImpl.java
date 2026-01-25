package com.example.demo.service.impl;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.List;
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
import com.example.demo.domain.request.tts.ReqTTSDTO;
import com.example.demo.domain.response.tts.ResTTSAudioDTO;
import com.example.demo.repository.TTSAudioRepository;
import com.example.demo.service.S3Service;
import com.example.demo.service.TTSAudioService;
import com.example.demo.util.error.IdInvalidException;

@Service
public class TTSAudioServiceImpl implements TTSAudioService {

    @Autowired
    private TTSAudioRepository ttsAudioRepository;

    @Autowired(required = false)
    private S3Service s3Service;

    @Value("${spring.aws.bucket-name:trung-tam-anh-ngu}")
    private String bucketName;

    @Override
    @Transactional
    public TTSAudio createTTSAudio(ReqTTSDTO request, byte[] audioData, String fileName, String createdBy)
            throws IOException {
        String contentType = request.getTtsReturnOption() == 2 ? "audio/wav" : "audio/mpeg";
        String s3Url = null;

        // Tính toán S3 URL (để log ra dù có upload thành công hay không)
        String fullFileName = "tts-audios/" + fileName;
        String expectedS3Url = String.format("https://%s.s3.amazonaws.com/%s",
                bucketName, fullFileName);

        // Thử upload lên S3 nếu S3Service có sẵn
        if (s3Service != null) {
            try {
                s3Url = s3Service.uploadFile(
                        new ByteArrayInputStream(audioData),
                        fileName,
                        contentType,
                        "tts-audios");

                // Log thành công
                System.out.println("========================================");
                System.out.println("✅ UPLOAD S3 THÀNH CÔNG!");
                System.out.println("📁 Bucket: " + bucketName);
                System.out.println("📂 Folder: tts-audios");
                System.out.println("📄 File Name: " + fileName);
                System.out.println("🔗 S3 URL: " + s3Url);
                System.out.println("🌐 S3 Console Link: https://s3.console.aws.amazon.com/s3/buckets/" +
                        bucketName + "/tts-audios?region=ap-southeast-1&tab=objects");
                System.out.println("========================================");
            } catch (Exception e) {
                // Log warning và URL sẽ là gì nếu upload thành công
                System.err.println("========================================");
                System.err.println("❌ UPLOAD S3 THẤT BẠI!");
                System.err.println("📁 Bucket: " + bucketName);
                System.err.println("📂 Folder: tts-audios");
                System.err.println("📄 File Name: " + fileName);
                System.err.println("🔗 URL sẽ là (nếu upload thành công): " + expectedS3Url);
                System.err.println("🌐 S3 Console Link: https://s3.console.aws.amazon.com/s3/buckets/" +
                        bucketName + "/tts-audios?region=ap-southeast-1&tab=objects");
                System.err.println("⚠️  Lỗi: " + e.getMessage());
                System.err.println("========================================");
                // Có thể throw exception nếu muốn bắt buộc phải có S3
                // throw new IOException("Lỗi khi upload file lên S3: " + e.getMessage(), e);
            }
        } else {
            System.err.println("========================================");
            System.err.println("⚠️  S3Service KHÔNG KHẢ DỤNG!");
            System.err.println("📁 Bucket: " + bucketName);
            System.err.println("📂 Folder: tts-audios");
            System.err.println("📄 File Name: " + fileName);
            System.err.println("🔗 URL sẽ là (nếu upload thành công): " + expectedS3Url);
            System.err.println("🌐 S3 Console Link: https://s3.console.aws.amazon.com/s3/buckets/" +
                    bucketName + "/tts-audios?region=ap-southeast-1&tab=objects");
            System.err.println("💡 Vui lòng cấu hình AWS credentials trong application.properties");
            System.err.println("========================================");
        }

        // Tạo entity (vẫn tạo được ngay cả khi không có S3)
        TTSAudio ttsAudio = TTSAudio.builder()
                .text(request.getText())
                .voice(request.getVoice())
                .speed(request.getSpeed())
                .format(request.getTtsReturnOption())
                .withoutFilter(request.getWithoutFilter())
                .fileName("tts-audios/" + fileName)
                .s3Url(s3Url) // Có thể là null nếu S3 không khả dụng
                .fileSize((long) audioData.length)
                .mimeType(contentType)
                .createdAt(Instant.now())
                .createdBy(createdBy)
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
            // Xóa file trên S3 nếu có
            if (s3Service != null && ttsAudio.getS3Url() != null) {
                try {
                    s3Service.deleteFile(ttsAudio.getFileName());
                } catch (Exception e) {
                    // Log warning nhưng vẫn tiếp tục xóa record trong DB
                    System.err.println("WARNING: Không thể xóa file trên S3: " + e.getMessage());
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
        ttsAudio.setText(request.getText());
        ttsAudio.setVoice(request.getVoice());
        ttsAudio.setSpeed(request.getSpeed());
        ttsAudio.setFormat(request.getTtsReturnOption());
        ttsAudio.setWithoutFilter(request.getWithoutFilter());
        ttsAudio.setUpdatedAt(Instant.now());
        return ttsAudioRepository.save(ttsAudio);
    }

    @Override
    public Resource getAudioResourceFromS3(String fileName) throws IOException {
        if (s3Service == null) {
            throw new IOException("S3Service không khả dụng");
        }
        
        try {
            InputStream inputStream = s3Service.getFileInputStream(fileName);
            return new InputStreamResource(inputStream);
        } catch (Exception e) {
            throw new IOException("Không thể lấy file từ S3: " + e.getMessage(), e);
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
                .build();
    }
}

package com.example.demo.service.impl;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.service.LocalStorageService;

import jakarta.annotation.PostConstruct;

@Service
public class LocalStorageServiceImpl implements LocalStorageService {

    @Value("${storage.local.base-dir:uploads}")
    private String baseDir;

    @Value("${storage.local.base-url:/uploads}")
    private String baseUrl;

    @PostConstruct
    public void init() {
        try {
            Path basePath = Paths.get(baseDir);
            if (!Files.exists(basePath)) {
                Files.createDirectories(basePath);
                System.out.println("✅ Đã tạo thư mục lưu trữ: " + basePath.toAbsolutePath());
            }
        } catch (IOException e) {
            System.err.println("⚠️  Không thể tạo thư mục lưu trữ: " + e.getMessage());
        }
    }

    private Path resolve(String... parts) {
        return Paths.get(baseDir, parts);
    }

    private Path resolveFile(String fileName) {
        // fileName có thể là "tts-audios/group/file.mp3" hoặc "tts-audios/file.mp3"
        if (fileName.startsWith("/")) {
            return resolve(fileName.substring(1));
        }
        return resolve(fileName);
    }

    @Override
    public String uploadFile(MultipartFile file, String folderName) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // Tạo tên file duy nhất: timestamp-random.ext
        String uniqueFileName = System.currentTimeMillis() + "-" +
                UUID.randomUUID().toString().substring(0, 8) + extension;

        // Xác định subfolder: folderName/YYYY/MM/DD/
        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        String relativePath = folderName + "/" + datePath + "/" + uniqueFileName;

        Path targetPath = resolveFile(relativePath);

        // Tạo thư mục nếu chưa có
        Files.createDirectories(targetPath.getParent());

        // Copy file
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        return getFileUrl(relativePath);
    }

    @Override
    public String uploadFile(InputStream inputStream, String fileName, String contentType, String folderName)
            throws Exception {
        if (inputStream == null) {
            throw new IllegalArgumentException("InputStream is null");
        }

        // Xác định relative path
        String relativePath;
        if (fileName != null && !fileName.isEmpty()) {
            // fileName có thể là "tts-audios/group-key/en-123.mp3"
            // Nếu folderName rỗng và fileName đã có prefix thì dùng trực tiếp
            if (folderName == null || folderName.isEmpty()) {
                relativePath = fileName;
            } else {
                // Tách path từ fileName, ghép với folderName
                // fileName có thể là "tts-audios/group/file.mp3" → lấy "group/file.mp3" rồi ghép
                if (fileName.contains("/")) {
                    String fileNamePart = fileName.substring(fileName.indexOf("/") + 1);
                    relativePath = folderName + "/" + fileNamePart;
                } else {
                    relativePath = folderName + "/" + fileName;
                }
            }
        } else {
            // Tạo tên file tạm
            String extension = getExtensionFromContentType(contentType);
            String uniqueFileName = System.currentTimeMillis() + "-" +
                    UUID.randomUUID().toString().substring(0, 8) + extension;
            relativePath = folderName + "/" + uniqueFileName;
        }

        Path targetPath = resolveFile(relativePath);

        // Tạo thư mục nếu chưa có
        Files.createDirectories(targetPath.getParent());

        // Copy file
        Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);

        return getFileUrl(relativePath);
    }

    @Override
    public void deleteFile(String fileName) throws Exception {
        if (fileName == null || fileName.isEmpty()) {
            return;
        }

        // Loại bỏ baseUrl prefix nếu có
        String relative = fileName;
        if (fileName.startsWith(baseUrl + "/")) {
            relative = fileName.substring(baseUrl.length() + 1);
        }

        Path path = resolveFile(relative);
        if (Files.exists(path)) {
            Files.delete(path);
        }
    }

    @Override
    public InputStream getFileInputStream(String fileName) throws Exception {
        if (fileName == null || fileName.isEmpty()) {
            throw new IllegalArgumentException("File name is null or empty");
        }

        // Loại bỏ baseUrl prefix nếu có
        String relative = fileName;
        if (fileName.startsWith(baseUrl + "/")) {
            relative = fileName.substring(baseUrl.length() + 1);
        }

        Path path = resolveFile(relative);

        if (!Files.exists(path)) {
            throw new IOException("File not found: " + fileName);
        }

        return Files.newInputStream(path);
    }

    @Override
    public String getFileUrl(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return null;
        }

        // Loại bỏ leading slash để ghép URL đúng
        String relative = fileName;
        if (fileName.startsWith("/")) {
            relative = fileName.substring(1);
        }

        return baseUrl + "/" + relative;
    }

    @Override
    public boolean fileExists(String fileName) {
        try {
            if (fileName == null || fileName.isEmpty()) {
                return false;
            }

            String relative = fileName;
            if (fileName.startsWith(baseUrl + "/")) {
                relative = fileName.substring(baseUrl.length() + 1);
            }

            Path path = resolveFile(relative);
            return Files.exists(path);
        } catch (Exception e) {
            return false;
        }
    }

    private String getExtensionFromContentType(String contentType) {
        if (contentType == null) {
            return "";
        }
        switch (contentType.toLowerCase()) {
            case "audio/mpeg":
            case "audio/mp3":
                return ".mp3";
            case "audio/wav":
            case "audio/wave":
                return ".wav";
            case "image/jpeg":
            case "image/jpg":
                return ".jpg";
            case "image/png":
                return ".png";
            case "image/gif":
                return ".gif";
            case "image/webp":
                return ".webp";
            default:
                return "";
        }
    }
}

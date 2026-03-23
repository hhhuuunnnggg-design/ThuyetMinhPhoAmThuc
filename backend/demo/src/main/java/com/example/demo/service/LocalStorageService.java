package com.example.demo.service;

import java.io.InputStream;

import org.springframework.web.multipart.MultipartFile;

public interface LocalStorageService {
    /**
     * Upload file từ MultipartFile.
     * @param file MultipartFile upload
     * @param folderName Tên thư mục con trong uploads/ (vd: "tts-audios", "food-images")
     * @return URL để truy cập file (ví dụ: /uploads/tts-audios/file.mp3)
     */
    String uploadFile(MultipartFile file, String folderName) throws Exception;

    /**
     * Upload file từ InputStream.
     * @param inputStream Dữ liệu file
     * @param fileName Tên file đầy đủ (có thể bao gồm subfolder như "tts-audios/group-key/en-123.mp3")
     * @param contentType MIME type
     * @param folderName Thư mục cha (sẽ ghép với fileName, đặt "" nếu fileName đã có path)
     * @return URL để truy cập file
     */
    String uploadFile(InputStream inputStream, String fileName, String contentType, String folderName) throws Exception;

    /**
     * Xóa file.
     * @param fileName Tên file (có thể bao gồm path)
     */
    void deleteFile(String fileName) throws Exception;

    /**
     * Lấy InputStream của file để đọc.
     * @param fileName Tên file (có thể bao gồm path)
     * @return InputStream của file
     */
    InputStream getFileInputStream(String fileName) throws Exception;

    /**
     * Lấy đường dẫn URL để truy cập file.
     * @param fileName Tên file (có thể bao gồm path)
     * @return URL để truy cập file
     */
    String getFileUrl(String fileName);

    /**
     * Kiểm tra file có tồn tại không.
     * @param fileName Tên file (có thể bao gồm path)
     * @return true nếu file tồn tại
     */
    boolean fileExists(String fileName);
}

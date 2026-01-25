package com.example.demo.service;

import java.io.InputStream;

import org.springframework.web.multipart.MultipartFile;

public interface S3Service {
    String uploadFile(MultipartFile file, String folderName) throws Exception;

    String uploadFile(InputStream inputStream, String fileName, String contentType, String folderName) throws Exception;

    void deleteFile(String fileName) throws Exception;

    String getFileUrl(String fileName);
}

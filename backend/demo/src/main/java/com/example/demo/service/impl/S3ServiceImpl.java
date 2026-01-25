package com.example.demo.service.impl;

import java.io.InputStream;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.service.S3Service;

import java.time.Duration;

import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@ConditionalOnBean(S3Client.class)
public class S3ServiceImpl implements S3Service {

    @Autowired(required = false)
    private S3Client s3Client;

    @Value("${spring.aws.bucket-name:}")
    private String bucketName;

    @Override
    public String uploadFile(MultipartFile file, String folderName) throws Exception {
        String fileName = folderName + "/" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
        return uploadFile(file.getInputStream(), fileName, file.getContentType(), folderName);
    }

    @Override
    public String uploadFile(InputStream inputStream, String fileName, String contentType, String folderName)
            throws Exception {
        String fullFileName = folderName + "/" + fileName;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(fullFileName)
                .contentType(contentType)
                .build();

        s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(inputStream, inputStream.available()));

        return getFileUrl(fullFileName);
    }

    @Override
    public void deleteFile(String fileName) throws Exception {
        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(fileName)
                .build();

        s3Client.deleteObject(deleteObjectRequest);
    }

    @Override
    public String getFileUrl(String fileName) {
        return String.format("https://%s.s3.amazonaws.com/%s", bucketName, fileName);
    }
    
    @Override
    public String getPresignedUrl(String fileName, int expirationMinutes) throws Exception {
        // Presigned URL sẽ được implement sau nếu cần
        throw new UnsupportedOperationException("Presigned URL chưa được implement");
    }
    
    @Override
    public java.io.InputStream getFileInputStream(String fileName) throws Exception {
        if (s3Client == null) {
            throw new IllegalStateException("S3Client không khả dụng");
        }
        
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(fileName)
                .build();
        
        ResponseInputStream<GetObjectResponse> response = s3Client.getObject(getObjectRequest);
        return response;
    }
}

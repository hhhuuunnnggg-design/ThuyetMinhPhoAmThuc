package com.example.demo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

// Annotation này đánh dấu lớp là một lớp cấu hình trong ứng dụng Spring,
// cho biết rằng lớp này chứa các định nghĩa bean và thiết lập cấu hình cho application context.
@Configuration
@ConditionalOnExpression("!'${spring.aws.access-key:}'.isEmpty() && !'${spring.aws.secret-key:}'.isEmpty()")
public class AWSconfig {

    // Biến này lưu trữ khóa truy cập AWS dùng để xác thực với các dịch vụ AWS.
    @Value("${spring.aws.access-key}")
    private String accessKey;

    // Khóa bí mật AWS, kết hợp với accessKey để xác thực.
    @Value("${spring.aws.secret-key}")
    private String secretKey;

    // Xác thực khu vực
    @Value("${spring.aws.region:us-east-1}")
    private String region;

    // S3Client để tương tác với dịch vụ AWS S3.
    @Bean
    public S3Client s3Client() {
        // Kiểm tra lại để đảm bảo access key không rỗng
        if (!StringUtils.hasText(accessKey) || !StringUtils.hasText(secretKey)) {
            throw new IllegalStateException("AWS access key và secret key không được để trống");
        }

        return S3Client.builder()
                // Thiết lập khu vực AWS từ giá trị của biến
                .region(Region.of(region))
                // credentialsProvider cung cấp thông tin xác thực (accessKey và secretKey) cho
                // S3Client.
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
                .build();
    }
}
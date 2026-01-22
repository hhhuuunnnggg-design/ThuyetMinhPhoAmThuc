package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
// Lớp cấu hình interceptor kiểm tra quyền hạn
public class PermissionInterceptorConfiguration implements WebMvcConfigurer {

    @Bean
    public PermissionInterceptor permissionInterceptor() {
        return new PermissionInterceptor();
    }

    /**
     * Danh sách endpoint được phép truy cập
     * (không bị chặn bởi PermissionInterceptor)
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {

        String[] whiteList = {
                "/",
                "/api/v1/auth/**",
                "/swagger-ui/**",
                "/v3/api-docs/**",
                "/api/v1/auth/social/login/**"

        };

        registry.addInterceptor(permissionInterceptor())
                .excludePathPatterns(whiteList);
    }
}

package com.example.demo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${storage.local.base-dir:uploads}")
    private String baseDir;

    @Value("${storage.local.base-url:/uploads}")
    private String baseUrl;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve files từ thư mục local (ví dụ: uploads/)
        // URL: /uploads/tts-audios/2026/03/23/file.mp3
        // File: uploads/tts-audios/2026/03/23/file.mp3
        String resourceLocation = "file:" + baseDir + "/";

        registry.addResourceHandler(baseUrl + "/**")
                .addResourceLocations(resourceLocation)
                .setCachePeriod(3600); // Cache 1 hour
    }
}

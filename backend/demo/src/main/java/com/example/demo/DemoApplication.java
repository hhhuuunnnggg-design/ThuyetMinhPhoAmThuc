package com.example.demo;

import java.io.File;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
public class DemoApplication {

	public static void main(String[] args) {
		// Load file .env và set vào System properties
		Dotenv dotenv = null;

		// Thử load từ nhiều vị trí
		String[] paths = { "./backend/demo/.env" };
		for (String path : paths) {
			File envFile = new File(path);
			if (envFile.exists()) {
				try {
					String dir = envFile.getParent() != null ? envFile.getParent() : ".";
					dotenv = Dotenv.configure().directory(dir).filename(envFile.getName()).load();
					if (dotenv.get("DB_URL") != null) {
						break;
					}
				} catch (Exception e) {
					continue;
				}
			}
		}

		// Set biến môi trường vào System properties (ghi đè nếu đã có)
		if (dotenv != null && dotenv.get("DB_URL") != null) {
			dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));
		}

		SpringApplication.run(DemoApplication.class, args);
	}
}

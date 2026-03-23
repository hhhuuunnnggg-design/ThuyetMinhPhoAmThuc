package com.example.demo.service.impl;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.demo.domain.dto.SupportedLanguage;
import com.example.demo.service.TranslationService;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import com.google.cloud.translate.v3.TranslateTextRequest;
import com.google.cloud.translate.v3.TranslateTextResponse;
import com.google.cloud.translate.v3.TranslationServiceClient;
import com.google.cloud.translate.v3.TranslationServiceSettings;
import java.util.Arrays;

@Service
public class GoogleTranslationServiceImpl implements TranslationService {

    @Value("${google.cloud.project-id:}")
    private String projectId;

    @Value("${google.cloud.credentials.json:}")
    private String credentialsJson;

    @Value("${google.cloud.credentials.path:}")
    private String credentialsPath;

    private GoogleCredentials getCredentials() throws IOException {
        System.out.println("🔍 [Translate] GCP Config - projectId: " + projectId + ", credentialsPath: " + credentialsPath + ", hasJson: " + (credentialsJson != null && !credentialsJson.isBlank()));
        // Ưu tiên: JSON string trong env var
        if (credentialsJson != null && !credentialsJson.isBlank()) {
            InputStream credentialsStream = new ByteArrayInputStream(
                    credentialsJson.getBytes(StandardCharsets.UTF_8));
            ServiceAccountCredentials sac = ServiceAccountCredentials.fromStream(credentialsStream);
            return sac.toBuilder().setScopes(Arrays.asList("https://www.googleapis.com/auth/cloud-platform")).build();
        }
        // Ưu tiên 2: File path
        if (credentialsPath != null && !credentialsPath.isBlank()) {
            java.io.File f = new java.io.File(credentialsPath);
            System.out.println("🔍 [Translate] Credentials file exists: " + f.exists() + ", absPath: " + f.getAbsolutePath());
            ServiceAccountCredentials sac = ServiceAccountCredentials.fromStream(new java.io.FileInputStream(credentialsPath));
            return sac.toBuilder().setScopes(Arrays.asList("https://www.googleapis.com/auth/cloud-platform")).build();
        }
        // Fallback: Application Default Credentials
        System.out.println("⚠️ [Translate] Using Application Default Credentials (no explicit credentials found)");
        return GoogleCredentials.getApplicationDefault();
    }

    private TranslationServiceClient createClient() throws IOException {
        TranslationServiceSettings.Builder builder = TranslationServiceSettings.newBuilder();

        GoogleCredentials credentials = getCredentials();
        // Force refresh credentials to get valid access token
        try {
            credentials.refresh();
            if (credentials.getAccessToken() != null) {
                System.out.println("🔍 [Translate] Credentials OK, accessToken: " + credentials.getAccessToken().getTokenValue().substring(0, 20) + "...");
            } else {
                System.out.println("⚠️ [Translate] Credentials refreshed but accessToken is NULL");
            }
        } catch (Exception ex) {
            System.err.println("❌ [Translate] Credentials refresh FAILED: " + ex.getClass().getName() + " - " + ex.getMessage());
            ex.printStackTrace();
        }
        builder.setCredentialsProvider(() -> credentials);

        return TranslationServiceClient.create(builder.build());
    }

    @Override
    public String translate(String text, String targetLang) {
        if (text == null || text.isBlank()) {
            return text;
        }
        if (SupportedLanguage.VI.equals(targetLang)) {
            return text;
        }
        try (TranslationServiceClient client = createClient()) {
            String parent = String.format("projects/%s/locations/global", projectId);

            System.out.println("🔍 [Translate] Calling API - parent: " + parent + ", text: '" + text + "', target: " + targetLang);

            TranslateTextRequest request = TranslateTextRequest.newBuilder()
                    .setParent(parent)
                    .addContents(text)
                    .setSourceLanguageCode(SupportedLanguage.VI)
                    .setTargetLanguageCode(targetLang)
                    .build();

            TranslateTextResponse response = client.translateText(request);
            System.out.println("🔍 [Translate] Full response: " + response.toString());
            if (response.getTranslationsCount() == 0) {
                System.out.println("❌ [Translate] Empty response - check API enablement and IAM permissions");
                throw new RuntimeException("Translation returned empty response");
            }
            return response.getTranslations(0).getTranslatedText();
        } catch (Throwable e) {
            System.err.println("❌ [Translate] " + e.getClass().getName() + ": " + e.getMessage());
            Throwable cause = e.getCause();
            if (cause != null) {
                System.err.println("   Cause: " + cause.getClass().getName() + ": " + cause.getMessage());
                if (cause.getCause() != null) {
                    System.err.println("   RootCause: " + cause.getCause().getClass().getName() + ": " + cause.getCause().getMessage());
                }
            }
            e.printStackTrace();
            throw new RuntimeException("Translation failed: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, String> translateToMultiple(String text) {
        if (text == null || text.isBlank()) {
            return new HashMap<>();
        }

        Map<String, String> results = new HashMap<>();
        // Gọi tuần tự cho từng ngôn ngữ
        String[] targetLangs = { SupportedLanguage.EN, SupportedLanguage.ZH,
                SupportedLanguage.JA, SupportedLanguage.KO, SupportedLanguage.FR };

        for (String lang : targetLangs) {
            try {
                results.put(lang, translate(text, lang));
            } catch (Exception e) {
                System.err.println("⚠️  Dịch thất bại sang " + lang + ": " + e.getMessage());
                results.put(lang, "");
            }
        }
        return results;
    }
}

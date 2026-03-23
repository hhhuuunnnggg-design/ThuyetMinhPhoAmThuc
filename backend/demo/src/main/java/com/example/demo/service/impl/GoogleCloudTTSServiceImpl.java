package com.example.demo.service.impl;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.demo.domain.dto.SupportedLanguage;
import com.example.demo.service.GoogleCloudTTSService;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.texttospeech.v1.SynthesisInput;
import com.google.cloud.texttospeech.v1.SynthesizeSpeechRequest;
import com.google.cloud.texttospeech.v1.SynthesizeSpeechResponse;
import com.google.cloud.texttospeech.v1.TextToSpeechClient;
import com.google.cloud.texttospeech.v1.TextToSpeechSettings;
import com.google.cloud.texttospeech.v1.VoiceSelectionParams;

@Service
public class GoogleCloudTTSServiceImpl implements GoogleCloudTTSService {

    @Value("${google.cloud.project-id:}")
    private String projectId;

    @Value("${google.cloud.credentials.json:}")
    private String credentialsJson;

    @Value("${google.cloud.credentials.path:}")
    private String credentialsPath;

    private GoogleCredentials getCredentials() throws IOException {
        // Ưu tiên: JSON string trong env var
        if (credentialsJson != null && !credentialsJson.isBlank()) {
            InputStream credentialsStream = new ByteArrayInputStream(
                    credentialsJson.getBytes(StandardCharsets.UTF_8));
            return GoogleCredentials.fromStream(credentialsStream);
        }
        // Ưu tiên 2: File path
        if (credentialsPath != null && !credentialsPath.isBlank()) {
            return GoogleCredentials.fromStream(new java.io.FileInputStream(credentialsPath));
        }
        // Fallback: Application Default Credentials
        return GoogleCredentials.getApplicationDefault();
    }

    private TextToSpeechClient createClient() throws IOException {
        TextToSpeechSettings.Builder builder = TextToSpeechSettings.newBuilder();
        builder.setCredentialsProvider(() -> getCredentials());
        return TextToSpeechClient.create(builder.build());
    }

    @Override
    public byte[] synthesize(String text, String languageCode, float speed) {
        if (text == null || text.isBlank()) {
            return new byte[0];
        }

        String voiceName = SupportedLanguage.getVoice(languageCode);
        if (voiceName == null) {
            throw new IllegalArgumentException("Unsupported language code: " + languageCode);
        }

        try (TextToSpeechClient client = createClient()) {
            // Dùng GCP language code đúng cho TTS (lowercase hyphenated)
            String gcpLangCode = SupportedLanguage.getGcpLanguageCode(languageCode);
            if (gcpLangCode == null) {
                throw new IllegalArgumentException("Unsupported language code for TTS: " + languageCode);
            }

            SynthesisInput input = SynthesisInput.newBuilder()
                    .setText(text)
                    .build();

            VoiceSelectionParams voice = VoiceSelectionParams.newBuilder()
                    .setLanguageCode(gcpLangCode)
                    .setName(voiceName)
                    .build();

            var audioConfig = com.google.cloud.texttospeech.v1.AudioConfig.newBuilder()
                    .setAudioEncoding(com.google.cloud.texttospeech.v1.AudioEncoding.MP3)
                    .setSpeakingRate(speed)
                    .build();

            SynthesizeSpeechRequest request = SynthesizeSpeechRequest.newBuilder()
                    .setInput(input)
                    .setVoice(voice)
                    .setAudioConfig(audioConfig)
                    .build();

            SynthesizeSpeechResponse response = client.synthesizeSpeech(request);
            return response.getAudioContent().toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Google Cloud TTS failed: " + e.getMessage(), e);
        }
    }
}

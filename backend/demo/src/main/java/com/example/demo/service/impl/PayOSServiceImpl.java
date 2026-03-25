package com.example.demo.service.impl;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.example.demo.domain.Payment;
import com.example.demo.service.PayOSService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class PayOSServiceImpl implements PayOSService {

    private static final Logger log = LoggerFactory.getLogger(PayOSServiceImpl.class);

    @Value("${ayos.client_id:}")
    private String clientId;

    @Value("${ayos.api_key:}")
    private String apiKey;

    @Value("${ayos.checksum_key:}")
    private String checksumKey;

    @Value("${ayos.base_url:https://api.payos.vn}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private boolean isConfigured() {
        return clientId != null && !clientId.isBlank()
                && apiKey != null && !apiKey.isBlank()
                && checksumKey != null && !checksumKey.isBlank();
    }

    @Override
    public Map<String, String> createPaymentLink(Payment payment) throws IOException {
        Map<String, String> result = new HashMap<>();

        if (!isConfigured()) {
            result.put("paymentLink", "https://payos.vn/mock/" + payment.getId());
            result.put("qrCode", "MOCK_QR_CODE_" + payment.getId());
            result.put("transactionId", "MOCK_TXN_" + System.currentTimeMillis());
            result.put("mock", "true");
            return result;
        }

        // Xây body gọi PayOS API với signature
        long orderCode = payment.getId();
        int amount = payment.getAmount() != null ? payment.getAmount().intValue() : 0;
        String description = payment.getDescription() != null
                ? payment.getDescription()
                : "Thanh toan thuyet minh am thuc";
        String returnUrl = "https://thuyetminhphoamthuc.com/payment/success";
        String cancelUrl = "https://thuyetminhphoamthuc.com/payment/cancel";

        String rawData = String.format(
                "amount=%d&cancelUrl=%s&orderCode=%d&returnUrl=%s",
                amount, cancelUrl, orderCode, returnUrl);
        String signature = signHmacSHA256(rawData, checksumKey);

        String requestBody = String.format("""
                {
                  "orderCode": %d,
                  "amount": %d,
                  "description": "%s",
                  "returnUrl": "%s",
                  "cancelUrl": "%s",
                  "signature": "%s"
                }
                """, orderCode, amount, description, returnUrl, cancelUrl, signature);

        String url = baseUrl + "/v2/payment_authorizations";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Client-Id", clientId);
        headers.set("X-Api-Key", apiKey);

        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());

            if (root.has("data") && !root.get("data").isNull()) {
                JsonNode data = root.get("data");
                result.put("paymentLink",
                        data.has("checkoutUrl") ? data.get("checkoutUrl").asText() : "");
                result.put("qrCode",
                        data.has("qrCode") ? data.get("qrCode").asText() : "");
                result.put("transactionId",
                        data.has("orderCode") ? data.get("orderCode").asText() : "");
            } else {
                result.put("error", root.has("desc") ? root.get("desc").asText() : "PayOS error");
            }
        } catch (Exception e) {
            log.error("PayOS API call failed", e);
            result.put("paymentLink", "https://payos.vn/error/" + payment.getId());
            result.put("error", e.getMessage());
        }

        result.put("mock", "false");
        return result;
    }

    @Override
    public boolean verifyWebhookSignature(String signature, String data) {
        if (checksumKey == null || checksumKey.isBlank()) {
            return true;
        }
        try {
            String computed = signHmacSHA256(data, checksumKey);
            return computed.equalsIgnoreCase(signature);
        } catch (Exception e) {
            return false;
        }
    }

    private String signHmacSHA256(String data, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                    key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("HMAC-SHA256 signing failed", e);
        }
    }
}

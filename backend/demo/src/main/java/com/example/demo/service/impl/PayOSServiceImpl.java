package com.example.demo.service.impl;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.demo.domain.Payment;
import com.example.demo.domain.POI;
import com.example.demo.domain.Restaurant;
import com.example.demo.service.PayOSService;

import vn.payos.PayOS;
import vn.payos.core.ClientOptions;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;

/**
 * Tích hợp PayOS theo SDK chính thức ({@code payOS.paymentRequests().create(...)}),
 * cùng cách làm với mẫu {@code main/java/com/springboot/payos}.
 *
 * <p>Ưu tiên credential trên {@link Restaurant} (admin đã cấu hình cho từng nhà hàng);
 * nếu thiếu thì dùng biến môi trường / {@code application.properties} (fallback toàn hệ thống).
 */
@Service
public class PayOSServiceImpl implements PayOSService {

    private static final Logger log = LoggerFactory.getLogger(PayOSServiceImpl.class);

    @Value("${PAYOS_CLIENT_ID:8bdecc99-302f-4f2a-ad92-09625534b531}")
    private String defaultClientId;

    @Value("${PAYOS_API_KEY:78a93170-6fd5-47ab-bc73-1cbf387c3237}")
    private String defaultApiKey;

    @Value("${PAYOS_CHECKSUM_KEY:b1ac247e87fbe9f4a0f2b46ed3f2c549c699d4015c310b4b7eb7fbdc0947d25d}")
    private String defaultChecksumKey;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendBaseUrl;

    private boolean isTripleConfigured(String clientId, String apiKey, String checksumKey) {
        return clientId != null && !clientId.isBlank()
                && apiKey != null && !apiKey.isBlank()
                && checksumKey != null && !checksumKey.isBlank();
    }

    private boolean hasRestaurantPayos(Restaurant r) {
        return r != null && isTripleConfigured(r.getPayosClientId(), r.getPayosApiKey(), r.getPayosChecksumKey());
    }

    private PayOS buildClient(String clientId, String apiKey, String checksumKey) {
        ClientOptions options = ClientOptions.builder()
                .clientId(clientId.trim())
                .apiKey(apiKey.trim())
                .checksumKey(checksumKey.trim())
                .logLevel(ClientOptions.LogLevel.NONE)
                .build();
        return new PayOS(options);
    }

    private String baseUrlNormalized() {
        String b = frontendBaseUrl == null ? "http://localhost:3000" : frontendBaseUrl.trim();
        if (b.endsWith("/")) {
            return b.substring(0, b.length() - 1);
        }
        return b;
    }

    @Override
    public Map<String, String> createPaymentLink(Payment payment) {
        Map<String, String> result = new HashMap<>();

        Restaurant restaurant = payment.getRestaurant();
        String clientId = defaultClientId;
        String apiKey = defaultApiKey;
        String checksumKey = defaultChecksumKey;

        if (hasRestaurantPayos(restaurant)) {
            clientId = restaurant.getPayosClientId();
            apiKey = restaurant.getPayosApiKey();
            checksumKey = restaurant.getPayosChecksumKey();
            result.put("credentialSource", "restaurant");
        } else {
            result.put("credentialSource", "default");
        }

        if (!isTripleConfigured(clientId, apiKey, checksumKey)) {
            log.warn("PayOS chưa cấu hình đủ (client/api/checksum). Trả về mock.");
            result.put("paymentLink", "https://payos.vn/mock/" + payment.getId());
            result.put("qrCode", "");
            result.put("transactionId", "MOCK_TXN_" + System.currentTimeMillis());
            result.put("mock", "true");
            return result;
        }

        POI poi = payment.getPoi();
        String productName = poi != null && poi.getFoodName() != null && !poi.getFoodName().isBlank()
                ? poi.getFoodName()
                : "Thanh toan thuyet minh am thuc";
        String description = payment.getDescription() != null && !payment.getDescription().isBlank()
                ? payment.getDescription()
                : productName;

        long amount = payment.getAmount() != null ? payment.getAmount() : 0L;
        if (amount <= 0) {
            result.put("error", "Số tiền không hợp lệ");
            result.put("mock", "false");
            return result;
        }

        // orderCode phải LỚN HƠN 0 và DUY NHẤT cho mỗi lần gọi PayOS.
        // PayOS sẽ từ chối nếu orderCode đã tồn tại trong hệ thống của họ.
        // Do mỗi Payment đại diện cho một giao dịch độc lập (bấm thanh toán → tạo payment mới),
        // ta ghép: paymentId + nanoTime để đảm bảo không bao giờ trùng.
        long orderCode;
        if (payment.getId() != null) {
            // Lấy 4 chữ số cuối của nanoTime (đủ random, không tràn long)
            int nanoTail = (int) (System.nanoTime() % 10000);
            if (nanoTail < 0) nanoTail = -nanoTail;
            orderCode = (long) payment.getId() * 10000 + nanoTail;
        } else {
            orderCode = System.currentTimeMillis();
        }
        if (orderCode <= 0) {
            orderCode = System.currentTimeMillis();
        }

        String base = baseUrlNormalized();
        String returnUrl = base + "/payment/success";
        String cancelUrl = base + "/payment/cancel";

        PayOS payOS = buildClient(clientId, apiKey, checksumKey);

        CreatePaymentLinkRequest req = CreatePaymentLinkRequest.builder()
                .orderCode(orderCode)
                .amount(amount)
                .description(description)
                .returnUrl(returnUrl)
                .cancelUrl(cancelUrl)
                .item(PaymentLinkItem.builder()
                        .name(productName)
                        .quantity(1)
                        .price(amount)
                        .build())
                .build();

        try {
            CreatePaymentLinkResponse data = payOS.paymentRequests().create(req);
            String checkout = data.getCheckoutUrl() != null ? data.getCheckoutUrl() : "";
            result.put("paymentLink", checkout);
            result.put("qrCode", data.getQrCode() != null ? data.getQrCode() : "");
            if (data.getPaymentLinkId() != null) {
                result.put("paymentLinkId", data.getPaymentLinkId());
            }
            Long oc = data.getOrderCode() != null ? data.getOrderCode() : orderCode;
            result.put("transactionId", String.valueOf(oc));
            result.put("mock", "false");
        } catch (Exception e) {
            log.error("PayOS create payment link failed", e);
            result.put("error", e.getMessage() != null ? e.getMessage() : "PayOS error");
            result.put("paymentLink", "");
            result.put("qrCode", "");
            result.put("mock", "false");
        }

        return result;
    }

    @Override
    public boolean verifyWebhookSignature(String signature, String data) {
        if (defaultChecksumKey == null || defaultChecksumKey.isBlank()) {
            return true;
        }
        try {
            String computed = signHmacSHA256(data, defaultChecksumKey);
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
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("HMAC-SHA256 signing failed", e);
        }
    }
}

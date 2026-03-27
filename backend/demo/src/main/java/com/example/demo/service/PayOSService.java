package com.example.demo.service;

import java.util.Map;

import com.example.demo.domain.Payment;

/**
 * PayOS Payment Gateway Integration.
 * Hỗ trợ tạo payment link và xử lý webhook.
 */
public interface PayOSService {

    /**
     * Tạo payment link trên PayOS (SDK chính thức).
     * @param payment Đối tượng payment đã lưu trong DB (cần có {@code id} làm {@code orderCode})
     * @return Map: paymentLink, qrCode, transactionId, paymentLinkId, mock, error, credentialSource
     */
    Map<String, String> createPaymentLink(Payment payment);

    /**
     * Xác minh webhook signature từ PayOS.
     */
    boolean verifyWebhookSignature(String signature, String data);
}

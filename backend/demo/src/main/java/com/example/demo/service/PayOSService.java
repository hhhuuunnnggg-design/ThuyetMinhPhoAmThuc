package com.example.demo.service;

import java.io.IOException;
import java.util.Map;

import com.example.demo.domain.Payment;

/**
 * PayOS Payment Gateway Integration.
 * Hỗ trợ tạo payment link và xử lý webhook.
 */
public interface PayOSService {

    /**
     * Tạo payment link trên PayOS.
     * @param payment Đối tượng payment đã lưu trong DB
     * @return Map chứa paymentLink, qrCode, transactionId
     */
    Map<String, String> createPaymentLink(Payment payment) throws IOException;

    /**
     * Xác minh webhook signature từ PayOS.
     */
    boolean verifyWebhookSignature(String signature, String data);
}

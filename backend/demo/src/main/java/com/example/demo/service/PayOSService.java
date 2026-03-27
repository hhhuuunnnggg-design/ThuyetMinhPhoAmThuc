package com.example.demo.service;

import java.util.Map;
import java.util.Optional;

import com.example.demo.domain.Payment;

import vn.payos.model.v2.paymentRequests.PaymentLink;

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
     * Lấy thông tin link thanh toán từ PayOS (GET /v2/payment-requests/{id}) —
     * {@code id} là orderCode (số) hoặc paymentLinkId (chuỗi), theo tài liệu PayOS.
     */
    Optional<PaymentLink> fetchPaymentLink(Payment payment);

    /**
     * Xác minh webhook signature từ PayOS.
     */
    boolean verifyWebhookSignature(String signature, String data);
}

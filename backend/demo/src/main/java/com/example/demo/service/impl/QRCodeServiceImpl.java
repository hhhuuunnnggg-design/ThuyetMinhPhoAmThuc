package com.example.demo.service.impl;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import org.springframework.stereotype.Service;

import com.example.demo.service.QRCodeService;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

/**
 * Triển khai QRCodeService dùng ZXing.
 *
 * <p>Quy ước nội dung QR POI:
 * <ul>
 *   <li>Frontend app (React) quét → dùng API GET /api/v1/app/pois/qr/{uuid}</li>
 * </ul>
 */
@Service
public class QRCodeServiceImpl implements QRCodeService {

    private static final int DEFAULT_SIZE = 300;

    @Override
    public byte[] generateQRImage(String content, int sizePx) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("QR content must not be blank");
        }
        int size = sizePx > 0 ? sizePx : DEFAULT_SIZE;

        try {
            QRCodeWriter writer = new QRCodeWriter();
            var hints = new java.util.HashMap<EncodeHintType, Object>();
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            hints.put(EncodeHintType.MARGIN, 2); // viền trắng xung quanh

            BitMatrix bitMatrix = writer.encode(content, BarcodeFormat.QR_CODE, size, size, hints);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR code image", e);
        }
    }
}

package com.example.demo.service;

import java.io.ByteArrayOutputStream;

/**
 * Sinh ảnh QR code dưới dạng byte[] (PNG) dùng ZXing.
 * Dùng cho POI QR — nội dung là UUID của POI để app quét, nhảy vào chi tiết.
 */
public interface QRCodeService {

    /**
     * Sinh ảnh QR PNG từ nội dung text.
     *
     * @param content  chuỗi muốn mã hóa (POI UUID, URL, v.v.)
     * @param sizePx   kích thước QR (px), nên >= 200 để quét dễ
     * @return mảng byte ảnh PNG
     */
    byte[] generateQRImage(String content, int sizePx);
}

package com.example.demo.service;

import java.util.List;

import com.example.demo.domain.DeviceConfig;
import com.example.demo.domain.DeviceConfig.RunningMode;
import com.example.demo.domain.POI;
import com.example.demo.domain.response.app.ResActiveNarrationDTO;
import com.example.demo.domain.response.app.ResDeviceConfigDTO;
import com.example.demo.domain.response.app.ResNearbyPOIDTO;
import com.example.demo.domain.response.app.ResPOIDTO;
import com.example.demo.domain.request.app.ReqNarrationLogDTO;
import com.example.demo.domain.response.app.ResPaymentDTO;
import com.example.demo.util.error.IdInvalidException;

public interface AppClientService {

    // ============ Device ============
    ResDeviceConfigDTO registerDevice(String deviceId, String osVersion, String appVersion,
            Integer ramMB, Integer storageFreeMB, DeviceConfig.NetworkType networkType);

    ResDeviceConfigDTO syncDevice(String deviceId, Double lat, Double lng, String downloadedVersions) throws IdInvalidException;

    ResDeviceConfigDTO getDeviceConfig(String deviceId) throws IdInvalidException;

    RunningMode checkRunningMode(String deviceId);

    // ============ POI ============
    List<ResPOIDTO> getAllPOIs() throws IdInvalidException;

    ResPOIDTO getPOIById(Long poiId) throws IdInvalidException;

    ResPOIDTO getPOIByQrCode(String qrCode) throws IdInvalidException;

    List<ResNearbyPOIDTO> getNearbyPOIs(double lat, double lng, double radiusKm);

    // ============ Narration ============
    void startNarration(String deviceId, Long poiId, Long audioId,
            String languageCode, Double lat, Double lng) throws IdInvalidException;

    void endNarration(Long activeNarrationId, Integer durationSeconds, String status) throws IdInvalidException;

    /**
     * Kết thúc phiên thuyết minh đang PLAYING của thiết bị (dashboard real-time).
     * Dùng khi app không lưu {@code activeNarrationId} hoặc rời vùng POI.
     */
    void endCurrentPlayingForDevice(String deviceId, String status);

    /** Ghi log phát thuyết minh (PLAYING/COMPLETED/SKIPPED) — dùng cho Narration Logs & analytics. */
    void logNarration(ReqNarrationLogDTO req) throws IdInvalidException;

    // ============ Dashboard ============
    List<ResActiveNarrationDTO> getActiveNarrations();

    long getActiveCountNearby(double lat, double lng, double radiusKm);

    // ============ Payment ============
    ResPaymentDTO createPayment(Long poiId, String userId, Long amount, String description) throws IdInvalidException;

    ResPaymentDTO getPayment(Long paymentId) throws IdInvalidException;

    void handlePayOSWebhook(String transactionId, String status) throws IdInvalidException;
}

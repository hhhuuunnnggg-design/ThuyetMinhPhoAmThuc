package com.example.demo.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.DeviceConfig.RunningMode;
import com.example.demo.domain.request.app.ReqDeviceRegisterDTO;
import com.example.demo.domain.request.app.ReqDeviceSyncDTO;
import com.example.demo.domain.request.app.ReqNarrationEndDTO;
import com.example.demo.domain.request.app.ReqNarrationLogDTO;
import com.example.demo.domain.request.app.ReqNarrationStartDTO;
import com.example.demo.domain.request.app.ReqNarrationStopDTO;
import com.example.demo.domain.request.app.ReqPaymentCreateDTO;
import com.example.demo.domain.response.app.ResActiveNarrationDTO;
import com.example.demo.domain.response.app.ResDeviceConfigDTO;
import com.example.demo.domain.response.app.ResNearbyPOIDTO;
import com.example.demo.domain.response.app.ResPOIDTO;
import com.example.demo.domain.response.app.ResPaymentDTO;
import com.example.demo.service.AppClientService;
import com.example.demo.util.annotation.ApiMessage;
import com.example.demo.util.error.IdInvalidException;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/app")
public class AppClientController {

    private final AppClientService appClientService;

    public AppClientController(AppClientService appClientService) {
        this.appClientService = appClientService;
    }

    // ============ Device ============

    /**
     * Đăng ký thiết bị mới với cấu hình.
     * Lần đầu mở app → gọi API này.
     */
    @PostMapping("/device/register")
    @ApiMessage("Đăng ký thiết bị")
    public ResponseEntity<ResDeviceConfigDTO> registerDevice(@Valid @RequestBody ReqDeviceRegisterDTO req) {
        ResDeviceConfigDTO result = appClientService.registerDevice(
                req.getDeviceId(),
                req.getOsVersion(),
                req.getAppVersion(),
                req.getRamMB(),
                req.getStorageFreeMB(),
                req.getNetworkType());
        return ResponseEntity.ok(result);
    }

    /**
     * Sync cấu hình thiết bị + vị trí.
     * Gọi định kỳ khi app chạy hoặc khi vào bán kính POI.
     */
    @PostMapping("/device/sync")
    @ApiMessage("Sync thiết bị")
    public ResponseEntity<ResDeviceConfigDTO> syncDevice(@Valid @RequestBody ReqDeviceSyncDTO req) throws IdInvalidException {
        ResDeviceConfigDTO result = appClientService.syncDevice(
                req.getDeviceId(),
                req.getLatitude(),
                req.getLongitude(),
                req.getDownloadedVersions());
        return ResponseEntity.ok(result);
    }

    /**
     * Lấy cấu hình thiết bị hiện tại.
     */
    @GetMapping("/device/config")
    @ApiMessage("Lấy cấu hình thiết bị")
    public ResponseEntity<ResDeviceConfigDTO> getDeviceConfig(@RequestParam String deviceId) throws IdInvalidException {
        return ResponseEntity.ok(appClientService.getDeviceConfig(deviceId));
    }

    /**
     * Kiểm tra chế độ chạy của thiết bị (OFFLINE vs STREAMING).
     */
    @GetMapping("/device/running-mode")
    @ApiMessage("Kiểm tra chế độ chạy")
    public ResponseEntity<String> checkRunningMode(@RequestParam String deviceId) {
        RunningMode mode = appClientService.checkRunningMode(deviceId);
        return ResponseEntity.ok(mode.name());
    }

    // ============ POI ============

    /**
     * Lấy tất cả POIs active (có GPS).
     */
    @GetMapping("/pois")
    @ApiMessage("Danh sách POIs")
    public ResponseEntity<List<ResPOIDTO>> getAllPOIs() throws IdInvalidException {
        return ResponseEntity.ok(appClientService.getAllPOIs());
    }

    /**
     * Lấy chi tiết POI theo ID.
     */
    @GetMapping("/pois/{id}")
    @ApiMessage("Chi tiết POI")
    public ResponseEntity<ResPOIDTO> getPOIById(@PathVariable Long id) throws IdInvalidException {
        return ResponseEntity.ok(appClientService.getPOIById(id));
    }

    /**
     * Tra cứu POI qua QR code.
     */
    @GetMapping("/pois/qr/{qrCode}")
    @ApiMessage("Tra cứu POI qua QR")
    public ResponseEntity<ResPOIDTO> getPOIByQr(@PathVariable String qrCode) throws IdInvalidException {
        return ResponseEntity.ok(appClientService.getPOIByQrCode(qrCode));
    }

    /**
     * Lấy POIs gần vị trí hiện tại.
     * @param lat  Vĩ độ
     * @param lng  Kinh độ
     * @param radiusKm Bán kính tìm kiếm (km). Mặc định 2km.
     */
    @GetMapping("/pois/nearby")
    @ApiMessage("POIs gần vị trí")
    public ResponseEntity<List<ResNearbyPOIDTO>> getNearbyPOIs(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "2.0") double radiusKm) {
        return ResponseEntity.ok(appClientService.getNearbyPOIs(lat, lng, radiusKm));
    }

    // ============ Narration ============

    /**
     * Bắt đầu phát thuyết minh.
     * Tạo ActiveNarration + QueueSession.
     */
    @PostMapping("/narration/start")
    @ApiMessage("Bắt đầu phát thuyết minh")
    public ResponseEntity<Void> startNarration(
            @RequestHeader("X-Device-Id") String deviceIdHeader,
            @Valid @RequestBody ReqNarrationStartDTO req) throws IdInvalidException {
        appClientService.startNarration(
                deviceIdHeader,
                req.getPoiId(),
                req.getAudioId(),
                req.getLanguageCode(),
                req.getLatitude(),
                req.getLongitude());
        return ResponseEntity.ok().build();
    }

    /**
     * Kết thúc phát thuyết minh.
     */
    @PostMapping("/narration/end")
    @ApiMessage("Kết thúc phát thuyết minh")
    public ResponseEntity<Void> endNarration(@Valid @RequestBody ReqNarrationEndDTO req) throws IdInvalidException {
        appClientService.endNarration(
                req.getActiveNarrationId(),
                req.getActualDurationSeconds(),
                req.getStatus());
        return ResponseEntity.ok().build();
    }

    /**
     * Dừng phiên đang PLAYING của thiết bị (theo {@code X-Device-Id}) — rời vùng POI / nút dừng / phát xong.
     */
    @PostMapping("/narration/stop")
    @ApiMessage("Dừng thuyết minh theo thiết bị")
    public ResponseEntity<Void> stopCurrentNarration(
            @RequestHeader("X-Device-Id") String deviceIdHeader,
            @RequestBody(required = false) ReqNarrationStopDTO req) {
        String status = req != null && req.getStatus() != null && !req.getStatus().isBlank()
                ? req.getStatus()
                : "EXPIRED";
        appClientService.endCurrentPlayingForDevice(deviceIdHeader, status);
        return ResponseEntity.ok().build();
    }

    /**
     * Ghi log phát thuyết minh (PLAYING/COMPLETED/SKIPPED).
     * Frontend gọi khi bắt đầu/kết thúc phát — khác với ActiveNarration (dashboard real-time).
     */
    @PostMapping("/narration/log")
    @ApiMessage("Ghi log narration")
    public ResponseEntity<Void> logNarration(@Valid @RequestBody ReqNarrationLogDTO req) throws IdInvalidException {
        appClientService.logNarration(req);
        return ResponseEntity.ok().build();
    }

    // ============ Dashboard ============

    /**
     * Lấy danh sách người đang nghe (cho app hiển thị nearby).
     */
    @GetMapping("/dashboard/active")
    @ApiMessage("Người đang nghe")
    public ResponseEntity<List<ResActiveNarrationDTO>> getActiveNarrations() {
        return ResponseEntity.ok(appClientService.getActiveNarrations());
    }

    /**
     * Đếm số người đang nghe trong bán kính.
     */
    @GetMapping("/dashboard/active-count")
    @ApiMessage("Số người đang nghe gần đây")
    public ResponseEntity<Long> getActiveCountNearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "2.0") double radiusKm) {
        return ResponseEntity.ok(appClientService.getActiveCountNearby(lat, lng, radiusKm));
    }

    // ============ Payment ============

    /**
     * Tạo payment qua PayOS.
     */
    @PostMapping("/payment/create")
    @ApiMessage("Tạo thanh toán")
    public ResponseEntity<ResPaymentDTO> createPayment(@Valid @RequestBody ReqPaymentCreateDTO req) throws IdInvalidException {
        return ResponseEntity.ok(appClientService.createPayment(
                req.getPoiId(),
                req.getUserId(),
                req.getAmount(),
                req.getDescription()));
    }

    /**
     * Kiểm tra trạng thái payment.
     */
    @GetMapping("/payment/{id}")
    @ApiMessage("Chi tiết payment")
    public ResponseEntity<ResPaymentDTO> getPayment(@PathVariable Long id) throws IdInvalidException {
        return ResponseEntity.ok(appClientService.getPayment(id));
    }

    /**
     * Webhook nhận kết quả thanh toán từ PayOS.
     */
    @PostMapping("/payment/webhook")
    @ApiMessage("PayOS webhook")
    public ResponseEntity<Void> paymentWebhook(
            @RequestParam String transactionId,
            @RequestParam String status) throws IdInvalidException {
        appClientService.handlePayOSWebhook(transactionId, status);
        return ResponseEntity.ok().build();
    }
}

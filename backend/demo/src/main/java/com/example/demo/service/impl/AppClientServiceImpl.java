package com.example.demo.service.impl;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.domain.ActiveNarration;
import com.example.demo.domain.ActiveNarration.NarrationStatus;
import com.example.demo.domain.DeviceConfig;
import com.example.demo.domain.DeviceConfig.NetworkType;
import com.example.demo.domain.DeviceConfig.RunningMode;
import com.example.demo.domain.POI;
import com.example.demo.domain.NarrationLog;
import com.example.demo.domain.Payment;
import com.example.demo.domain.Payment.PaymentStatus;
import com.example.demo.domain.TTSAudio;
import com.example.demo.domain.TTSAudioGroup;
import com.example.demo.domain.dto.SupportedLanguage;
import com.example.demo.domain.request.app.ReqNarrationLogDTO;
import com.example.demo.domain.response.app.ResActiveNarrationDTO;
import com.example.demo.domain.response.app.ResDeviceConfigDTO;
import com.example.demo.domain.response.app.ResNearbyPOIDTO;
import com.example.demo.domain.response.app.ResPOIDTO;
import com.example.demo.domain.response.app.ResPaymentDTO;
import com.example.demo.repository.ActiveNarrationRepository;
import com.example.demo.repository.DeviceConfigRepository;
import com.example.demo.repository.POIRepository;
import com.example.demo.repository.PaymentRepository;
import com.example.demo.repository.TTSAudioGroupRepository;
import com.example.demo.repository.TTSAudioRepository;
import com.example.demo.service.AppClientService;
import com.example.demo.service.GeofenceService;
import com.example.demo.service.NarrationService;
import com.example.demo.service.PayOSService;
import com.example.demo.util.error.IdInvalidException;

@Service
public class AppClientServiceImpl implements AppClientService {

    private final POIRepository poiRepository;
    private final DeviceConfigRepository deviceConfigRepository;
    private final ActiveNarrationRepository activeNarrationRepository;
    private final PaymentRepository paymentRepository;
    private final TTSAudioRepository ttsAudioRepository;
    private final TTSAudioGroupRepository ttsAudioGroupRepository;
    private final GeofenceService geofenceService;
    private final NarrationService narrationService;
    private final PayOSService payOSService;

    public AppClientServiceImpl(
            POIRepository poiRepository,
            DeviceConfigRepository deviceConfigRepository,
            ActiveNarrationRepository activeNarrationRepository,
            PaymentRepository paymentRepository,
            TTSAudioRepository ttsAudioRepository,
            TTSAudioGroupRepository ttsAudioGroupRepository,
            GeofenceService geofenceService,
            NarrationService narrationService,
            PayOSService payOSService) {
        this.poiRepository = poiRepository;
        this.deviceConfigRepository = deviceConfigRepository;
        this.activeNarrationRepository = activeNarrationRepository;
        this.paymentRepository = paymentRepository;
        this.ttsAudioRepository = ttsAudioRepository;
        this.ttsAudioGroupRepository = ttsAudioGroupRepository;
        this.geofenceService = geofenceService;
        this.narrationService = narrationService;
        this.payOSService = payOSService;
    }

    // ============ Device ============

    @Override
    @Transactional
    public ResDeviceConfigDTO registerDevice(String deviceId, String osVersion, String appVersion,
            Integer ramMB, Integer storageFreeMB, NetworkType networkType) {

        DeviceConfig config = deviceConfigRepository.findByDeviceId(deviceId)
                .orElse(DeviceConfig.builder()
                        .deviceId(deviceId)
                        .createdAt(Instant.now())
                        .build());

        config.setOsVersion(osVersion);
        config.setAppVersion(appVersion);
        config.setRamMB(ramMB);
        config.setStorageFreeMB(storageFreeMB);
        config.setNetworkType(networkType);
        config.setRunningMode(config.computeRunningMode());
        config.setUpdatedAt(Instant.now());
        config.setLastSeenAt(Instant.now());

        config = deviceConfigRepository.save(config);
        return buildDeviceConfigDTO(config);
    }

    @Override
    @Transactional
    public ResDeviceConfigDTO syncDevice(String deviceId, Double lat, Double lng, String downloadedVersions)
            throws IdInvalidException {
        DeviceConfig config = deviceConfigRepository.findByDeviceId(deviceId)
                .orElseThrow(() -> new IdInvalidException("Thiết bị chưa đăng ký: " + deviceId));

        config.setLastLat(lat);
        config.setLastLng(lng);
        config.setDownloadedVersions(downloadedVersions);
        config.setLastSyncAt(Instant.now());
        config.setUpdatedAt(Instant.now());
        config.setLastSeenAt(Instant.now());
        config.setRunningMode(config.computeRunningMode());

        config = deviceConfigRepository.save(config);

        // Build pois needing sync
        Map<Long, Integer> poisNeedingSync = new HashMap<>();
        if (config.getRunningMode() == RunningMode.OFFLINE) {
            poiRepository.findAllActiveWithLocation(org.springframework.data.domain.Pageable.unpaged()).getContent()
                    .forEach(poi -> {
                        int currentVersion = poi.getVersion() != null ? poi.getVersion() : 1;
                        poisNeedingSync.put(poi.getId(), currentVersion);
                    });
        }

        return ResDeviceConfigDTO.builder()
                .id(config.getId())
                .deviceId(config.getDeviceId())
                .runningMode(config.getRunningMode())
                .offlineModeEnabled(config.getOfflineModeEnabled())
                .lastSyncAt(config.getLastSyncAt())
                .downloadedVersions(config.getDownloadedVersions())
                .totalDownloadedMB(config.getTotalDownloadedMB())
                .lastSeenAt(config.getLastSeenAt())
                .poisNeedingSync(poisNeedingSync)
                .build();
    }

    @Override
    public ResDeviceConfigDTO getDeviceConfig(String deviceId) throws IdInvalidException {
        DeviceConfig config = deviceConfigRepository.findByDeviceId(deviceId)
                .orElseThrow(() -> new IdInvalidException("Thiết bị chưa đăng ký: " + deviceId));
        return buildDeviceConfigDTO(config);
    }

    @Override
    public RunningMode checkRunningMode(String deviceId) {
        return deviceConfigRepository.findByDeviceId(deviceId)
                .map(DeviceConfig::getRunningMode)
                .orElse(RunningMode.STREAMING);
    }

    // ============ POI ============

    @Override
    @Transactional(readOnly = true)
    public List<ResPOIDTO> getAllPOIs() throws IdInvalidException {
        return poiRepository.findByIsActiveTrue(org.springframework.data.domain.Pageable.unpaged())
                .getContent().stream()
                .map(this::buildPOIDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ResPOIDTO getPOIById(Long poiId) throws IdInvalidException {
        POI poi = poiRepository.findById(poiId)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy POI: " + poiId));
        return buildPOIDTO(poi);
    }

    @Override
    @Transactional(readOnly = true)
    public ResPOIDTO getPOIByQrCode(String qrCode) throws IdInvalidException {
        POI poi = poiRepository.findByQrCode(qrCode)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy POI với QR: " + qrCode));
        return buildPOIDTO(poi);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResNearbyPOIDTO> getNearbyPOIs(double lat, double lng, double radiusKm) {
        List<POI> nearbyPOIs = poiRepository.findNearby(lat, lng, radiusKm);
        Map<Long, Integer> activeCounts = activeNarrationRepository.countPlayingByPoi().stream()
                .collect(Collectors.toMap(
                        arr -> (Long) arr[0],
                        arr -> ((Number) arr[1]).intValue()));

        return nearbyPOIs.stream().map(poi -> {
            double dist = geofenceService.haversineDistance(
                    lat, lng,
                    poi.getLatitude(), poi.getLongitude());
            ResPOIDTO full = buildPOIDTO(poi);
            return ResNearbyPOIDTO.builder()
                    .id(full.getId())
                    .groupId(full.getGroupId())
                    .groupKey(full.getGroupKey())
                    .foodName(full.getFoodName())
                    .imageUrl(full.getImageUrl())
                    .latitude(full.getLatitude())
                    .longitude(full.getLongitude())
                    .triggerRadiusMeters(full.getTriggerRadiusMeters())
                    .priority(full.getPriority())
                    .price(full.getPrice())
                    .category(full.getCategory())
                    .address(full.getAddress())
                    .audios(full.getAudios())
                    .distanceMeters((double) Math.round(dist))
                    .activeListenerCount(activeCounts.getOrDefault(poi.getId(), 0))
                    .downloadedOffline(false)
                    .build();
        }).collect(Collectors.toList());
    }

    // ============ Narration ============

    @Override
    @Transactional
    public void startNarration(String deviceId, Long poiId, Long audioId,
            String languageCode, Double lat, Double lng) throws IdInvalidException {

        POI poi = poiRepository.findById(poiId)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy POI: " + poiId));
        TTSAudio audio = ttsAudioRepository.findById(audioId)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy audio: " + audioId));

        // Đánh dấu active narration trước đó của device là EXPIRED
        activeNarrationRepository.findByDeviceIdAndStatus(deviceId, NarrationStatus.PLAYING)
                .ifPresent(an -> {
                    an.expire();
                    activeNarrationRepository.save(an);
                });

        // Tạo active narration mới
        ActiveNarration active = ActiveNarration.builder()
                .deviceId(deviceId)
                .poi(poi)
                .audio(audio)
                .languageCode(languageCode)
                .startedAt(Instant.now())
                .latitude(lat)
                .longitude(lng)
                .status(NarrationStatus.PLAYING)
                .build();

        // Ước tính thời gian kết thúc (giả định audio ~30-60s)
        long estimatedDuration = 30_000L; // 30s mặc định
        if (audio.getFileSize() != null && audio.getFileSize() > 0) {
            // Ước tính: ~16kbps cho mp3
            estimatedDuration = (audio.getFileSize() * 8 / 16) * 1000;
        }
        active.setEstimatedEndAt(Instant.now().plusMillis(estimatedDuration));

        activeNarrationRepository.save(active);
    }

    @Override
    @Transactional
    public void logNarration(ReqNarrationLogDTO req) throws IdInvalidException {
        TTSAudio audio = ttsAudioRepository.findById(req.getTtsAudioId())
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy audio: " + req.getTtsAudioId()));

        NarrationLog log = NarrationLog.builder()
                .deviceId(req.getDeviceId())
                .ttsAudio(audio)
                .playedAt(Instant.ofEpochMilli(req.getPlayedAt()))
                .durationSeconds(req.getDurationSeconds())
                .status(req.getStatus())
                .build();

        narrationService.logPlay(log);
    }

    @Override
    @Transactional
    public void endNarration(Long activeNarrationId, Integer durationSeconds, String status)
            throws IdInvalidException {
        ActiveNarration active = activeNarrationRepository.findById(activeNarrationId)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy active narration: " + activeNarrationId));

        if ("COMPLETED".equalsIgnoreCase(status)) {
            active.complete();
        } else if ("SKIPPED".equalsIgnoreCase(status)) {
            active.skip();
        } else {
            active.expire();
        }

        activeNarrationRepository.save(active);
    }

    // ============ Dashboard ============

    @Override
    public List<ResActiveNarrationDTO> getActiveNarrations() {
        return activeNarrationRepository.findByStatus(NarrationStatus.PLAYING)
                .stream()
                .map(this::buildActiveNarrationDTO)
                .collect(Collectors.toList());
    }

    @Override
    public long getActiveCountNearby(double lat, double lng, double radiusKm) {
        List<POI> nearbyPOIs = poiRepository.findNearby(lat, lng, radiusKm);
        return nearbyPOIs.stream()
                .mapToLong(poi -> activeNarrationRepository.countPlayingByPoi(poi.getId()))
                .sum();
    }

    // ============ Payment ============

    @Override
    @Transactional
    public ResPaymentDTO createPayment(Long poiId, String userId, Long amount, String description)
            throws IdInvalidException {
        POI poi = poiRepository.findById(poiId)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy POI: " + poiId));

        Payment payment = Payment.builder()
                .userId(userId)
                .poi(poi)
                .restaurant(poi.getRestaurant())
                .amount(amount)
                .status(PaymentStatus.PENDING)
                .description(description != null ? description : "Thanh toan thuyet minh")
                .createdAt(Instant.now())
                .build();

        payment = paymentRepository.save(payment);

        try {
            Map<String, String> payos = payOSService.createPaymentLink(payment);
            if (payos != null) {
                String link = payos.get("paymentLink");
                if (link != null && !link.isBlank()) {
                    payment.setPayosPaymentLink(link);
                }
                String qr = payos.get("qrCode");
                if (qr != null && !qr.isBlank()) {
                    payment.setPayosQrCode(qr);
                }
                String plId = payos.get("paymentLinkId");
                if (plId != null && !plId.isBlank()) {
                    payment.setPayosPaymentLinkId(plId);
                }
                String txn = payos.get("transactionId");
                if (txn != null && !txn.isBlank() && !Boolean.parseBoolean(payos.getOrDefault("mock", "false"))) {
                    payment.setPayosTransactionId(txn);
                }
                payment.setUpdatedAt(Instant.now());
                payment = paymentRepository.save(payment);
            }
        } catch (Exception e) {
            // Vẫn trả payment PENDING; client có thể thử lại hoặc mở link sau
        }

        return buildPaymentDTO(payment);
    }

    @Override
    public ResPaymentDTO getPayment(Long paymentId) throws IdInvalidException {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy payment: " + paymentId));
        return buildPaymentDTO(payment);
    }

    @Override
    @Transactional
    public void handlePayOSWebhook(String transactionId, String status) throws IdInvalidException {
        Payment payment = paymentRepository.findByPayosTransactionId(transactionId)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy payment: " + transactionId));

        if ("SUCCESS".equalsIgnoreCase(status) || "COMPLETED".equalsIgnoreCase(status)) {
            payment.markSuccess(transactionId);
        } else if ("CANCELLED".equalsIgnoreCase(status)) {
            payment.markCancelled();
        } else {
            payment.markFailed();
        }
        paymentRepository.save(payment);
    }

    // ============ Builders ============

    private ResDeviceConfigDTO buildDeviceConfigDTO(DeviceConfig config) {
        return ResDeviceConfigDTO.builder()
                .id(config.getId())
                .deviceId(config.getDeviceId())
                .runningMode(config.getRunningMode())
                .offlineModeEnabled(config.getOfflineModeEnabled())
                .lastSyncAt(config.getLastSyncAt())
                .downloadedVersions(config.getDownloadedVersions())
                .totalDownloadedMB(config.getTotalDownloadedMB())
                .lastSeenAt(config.getLastSeenAt())
                .build();
    }

    /**
     * URL để app tải file offline. Ưu tiên {@code s3Url} trên bản ghi TTSAudio (thường là {@code /uploads/...}).
     * Nếu trống hoặc còn link S3/AWS cũ (file đã chuyển về local), fallback endpoint stream theo groupKey —
     * cùng logic {@link com.example.demo.service.impl.TTSAudioServiceImp#getAudioResource}.
     */
    private String resolveAppAudioUrl(TTSAudioGroup group, TTSAudio a) {
        String raw = a.getS3Url();
        if (raw != null && !raw.isBlank() && !isStaleCloudStorageUrl(raw)) {
            return raw;
        }
        String lang = a.getLanguageCode();
        return "/api/v1/tts/groups/" + group.getGroupKey() + "/audio/" + lang;
    }

    private static boolean isStaleCloudStorageUrl(String url) {
        String u = url.toLowerCase();
        return u.contains("amazonaws.com") || u.startsWith("s3://");
    }

    private ResPOIDTO buildPOIDTO(POI poi) {
        // Lấy tất cả TTSAudioGroup thuộc về POI này
        List<TTSAudioGroup> groups = ttsAudioGroupRepository.findByPoiId(poi.getId());
        TTSAudioGroup primaryGroup = !groups.isEmpty() ? groups.get(0) : null;

        Map<String, ResPOIDTO.ResAudioInfoDTO> audioMap = new HashMap<>();
        for (TTSAudioGroup g : groups) {
            List<TTSAudio> groupAudios = ttsAudioRepository.findByGroup_Id(g.getId());
            for (TTSAudio a : groupAudios) {
                String lang = a.getLanguageCode();
                audioMap.putIfAbsent(lang, ResPOIDTO.ResAudioInfoDTO.builder()
                        .audioId(a.getId())
                        .languageCode(lang)
                        .languageName(SupportedLanguage.getName(lang))
                        .voice(a.getVoice())
                        .speed(a.getSpeed())
                        .format(a.getFormat())
                        .withoutFilter(a.getWithoutFilter())
                        .s3Url(resolveAppAudioUrl(g, a))
                        .fileSize(a.getFileSize())
                        .mimeType(a.getMimeType())
                        .build());
            }
        }

        return ResPOIDTO.builder()
                .id(poi.getId())
                .groupId(primaryGroup != null ? primaryGroup.getId() : null)
                .groupKey(primaryGroup != null ? primaryGroup.getGroupKey() : null)
                // Thông tin ẩm thực từ POI
                .foodName(poi.getFoodName())
                .price(poi.getPrice())
                .description(poi.getDescription())
                .imageUrl(poi.getImageUrl())
                // GPS từ POI
                .latitude(poi.getLatitude())
                .longitude(poi.getLongitude())
                .accuracy(poi.getAccuracy())
                .triggerRadiusMeters(poi.getTriggerRadiusMeters())
                .priority(poi.getPriority())
                // Text/voice gốc từ primary group (nếu có)
                .originalText(primaryGroup != null ? primaryGroup.getOriginalText() : null)
                .originalVoice(primaryGroup != null ? primaryGroup.getOriginalVoice() : null)
                .address(poi.getAddress())
                .category(poi.getCategory())
                .openHours(poi.getOpenHours())
                .phone(poi.getPhone())
                .isActive(poi.getIsActive())
                .viewCount(poi.getViewCount())
                .likeCount(poi.getLikeCount())
                .qrCode(poi.getQrCode())
                .version(poi.getVersion())
                .restaurantName(poi.getRestaurant() != null ? poi.getRestaurant().getOwnerName() : null)
                .restaurantVerified(poi.getRestaurant() != null ? poi.getRestaurant().getIsVerified() : false)
                .audios(audioMap)
                .createdAt(poi.getCreatedAt())
                .updatedAt(poi.getUpdatedAt())
                .build();
    }

    private ResActiveNarrationDTO buildActiveNarrationDTO(ActiveNarration an) {
        return ResActiveNarrationDTO.builder()
                .id(an.getId())
                .deviceId(an.getDeviceId())
                .poiId(an.getPoi().getId())
                .poiName(an.getPoi().getFoodName())
                .audioId(an.getAudio().getId())
                .languageCode(an.getLanguageCode())
                .startedAt(an.getStartedAt())
                .estimatedEndAt(an.getEstimatedEndAt())
                .status(an.getStatus().name())
                .latitude(an.getLatitude())
                .longitude(an.getLongitude())
                .build();
    }

    private ResPaymentDTO buildPaymentDTO(Payment p) {
        return ResPaymentDTO.builder()
                .id(p.getId())
                .userId(p.getUserId())
                .poiId(p.getPoi() != null ? p.getPoi().getId() : null)
                .poiName(p.getPoi() != null ? p.getPoi().getFoodName() : null)
                .restaurantId(p.getRestaurant() != null ? p.getRestaurant().getId() : null)
                .restaurantName(p.getRestaurant() != null ? p.getRestaurant().getOwnerName() : null)
                .amount(p.getAmount())
                .currency(p.getCurrency())
                .status(p.getStatus().name())
                .payosTransactionId(p.getPayosTransactionId())
                .payosPaymentLink(p.getPayosPaymentLink())
                .payosQrCode(p.getPayosQrCode())
                .paidAt(p.getPaidAt())
                .createdAt(p.getCreatedAt())
                .description(p.getDescription())
                .build();
    }
}

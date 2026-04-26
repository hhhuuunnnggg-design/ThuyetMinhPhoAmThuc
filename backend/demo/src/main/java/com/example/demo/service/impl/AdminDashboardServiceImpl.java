package com.example.demo.service.impl;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.example.demo.domain.POI;
import com.example.demo.domain.Payment.PaymentStatus;
import com.example.demo.domain.response.admin.ResDashboardDTO;
import com.example.demo.domain.response.admin.ResDashboardDTO.POIQueueCount;
import com.example.demo.domain.response.admin.ResLoadTestResultDTO;
import com.example.demo.domain.response.admin.ResLoadTestResultDTO.PhaseLatency;
import com.example.demo.domain.response.admin.ResOnlineStatsDTO;
import com.example.demo.domain.response.admin.ResTopPOIDTO;
import com.example.demo.domain.response.admin.ResTranslationStatsDTO;
import com.example.demo.domain.response.app.ResActiveNarrationDTO;
import com.example.demo.repository.ActiveNarrationRepository;
import com.example.demo.repository.DeviceConfigRepository;
import com.example.demo.repository.NarrationLogRepository;
import com.example.demo.repository.POIRepository;
import com.example.demo.repository.PaymentRepository;
import com.example.demo.repository.QueueSessionRepository;
import com.example.demo.repository.TranslationTrainingRepository;
import com.example.demo.service.AdminDashboardService;
import com.example.demo.service.AppClientService;
import com.example.demo.util.SecurityUtil;

@Service
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final POIRepository poiRepository;
    private final DeviceConfigRepository deviceConfigRepository;
    private final ActiveNarrationRepository activeNarrationRepository;
    private final QueueSessionRepository queueSessionRepository;
    private final PaymentRepository paymentRepository;
    private final NarrationLogRepository narrationLogRepository;
    private final TranslationTrainingRepository translationTrainingRepository;
    private final AppClientService appClientService;

    public AdminDashboardServiceImpl(
            POIRepository poiRepository,
            DeviceConfigRepository deviceConfigRepository,
            ActiveNarrationRepository activeNarrationRepository,
            QueueSessionRepository queueSessionRepository,
            PaymentRepository paymentRepository,
            NarrationLogRepository narrationLogRepository,
            TranslationTrainingRepository translationTrainingRepository,
            AppClientService appClientService) {
        this.poiRepository = poiRepository;
        this.deviceConfigRepository = deviceConfigRepository;
        this.activeNarrationRepository = activeNarrationRepository;
        this.queueSessionRepository = queueSessionRepository;
        this.paymentRepository = paymentRepository;
        this.narrationLogRepository = narrationLogRepository;
        this.translationTrainingRepository = translationTrainingRepository;
        this.appClientService = appClientService;
    }

    @Override
    public ResDashboardDTO getDashboard() {
        Instant todayStart = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant last24h = Instant.now().minusSeconds(86400);

        long totalPOIs = poiRepository.count();
        long activePOIs = poiRepository.findByIsActiveTrue(org.springframework.data.domain.Pageable.unpaged())
                .getTotalElements();
        long totalDevices = deviceConfigRepository.count();
        long activeDevices = deviceConfigRepository.countActiveDevices(last24h);
        long offlineDevices = deviceConfigRepository.countOfflineModeDevices();

        long currentlyPlaying = activeNarrationRepository.countCurrentlyPlayingOnline(Instant.now().minusSeconds(15));
        long activeSessions = queueSessionRepository.findAllActiveSessions().size();
        long totalNarrationsToday = narrationLogRepository.countByPlayedAtAfter(todayStart);
        if (totalNarrationsToday == 0) {
            totalNarrationsToday = queueSessionRepository.countTodayTotal(todayStart);
        }

        Long revenueToday = paymentRepository.sumRevenueToday(todayStart);
        long pendingPayments = paymentRepository.countByStatusToday(PaymentStatus.PENDING, todayStart);
        long successPayments = paymentRepository.countByStatusToday(PaymentStatus.SUCCESS, todayStart);

        List<POIQueueCount> topActive = getPOIQueueCounts();

        return ResDashboardDTO.builder()
                .totalPOIs(totalPOIs)
                .activePOIs(activePOIs)
                .totalDevices(totalDevices)
                .activeDevicesLast24h(activeDevices)
                .offlineModeDevices(offlineDevices)
                .totalNarrationsToday(totalNarrationsToday)
                .currentlyPlaying(currentlyPlaying)
                .activeSessions(activeSessions)
                .revenueToday(revenueToday != null ? revenueToday : 0L)
                .paymentsPending(pendingPayments)
                .paymentsSuccessToday(successPayments)
                .topActivePOIs(topActive)
                .offlineModeCount(offlineDevices)
                .streamingModeCount(activeDevices - offlineDevices)
                .build();
    }

    @Override
    public List<POIQueueCount> getPOIQueueCounts() {
        List<Object[]> activeCounts = activeNarrationRepository.countPlayingByPoi();

        Long ownerScope = SecurityUtil.getPoiOwnerScopeUserIdOrNull();
        List<POI> allPOIs = ownerScope != null
                ? poiRepository.findPageForAdminByOwnerUserId(ownerScope, Pageable.unpaged()).getContent()
                : poiRepository.findAll();
        Instant todayStart = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();

        return allPOIs.stream().map(poi -> {
            int playing = activeCounts.stream()
                    .filter(o -> ((Number) o[0]).longValue() == poi.getId())
                    .findFirst()
                    .map(o -> ((Number) o[1]).intValue())
                    .orElse(0);
            long todayCount = queueSessionRepository.countTodayByPoiId(poi.getId(), todayStart);
            Long revenue = paymentRepository.sumRevenueByRestaurantToday(
                    poi.getRestaurant() != null ? poi.getRestaurant().getId() : -1L, todayStart);

            return POIQueueCount.builder()
                    .poiId(poi.getId())
                    .poiName(poi.getFoodName() != null ? poi.getFoodName() : "POI #" + poi.getId())
                    .activeCount(playing)
                    .todayCount(todayCount)
                    .todayRevenue(revenue != null ? revenue : 0L)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public List<ResActiveNarrationDTO> getActiveNarrationsForAdmin() {
        Long ownerScope = SecurityUtil.getPoiOwnerScopeUserIdOrNull();
        return appClientService.getActiveNarrationsScoped(ownerScope);
    }

    @Override
    public List<ResTopPOIDTO> getTopPOIsByNarration(LocalDate fromDate, LocalDate toDate, Integer limit) {
        ZoneId z = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(z);
        if (fromDate == null && toDate == null) {
            fromDate = today.minusDays(6);
            toDate = today;
        } else if (fromDate == null) {
            fromDate = toDate;
        } else if (toDate == null) {
            toDate = today;
        }
        if (toDate.isBefore(fromDate)) {
            LocalDate tmp = fromDate;
            fromDate = toDate;
            toDate = tmp;
        }

        Instant fromInst = fromDate.atStartOfDay(z).toInstant();
        Instant toExclusive = toDate.plusDays(1).atStartOfDay(z).toInstant();
        int topLimit = (limit != null && limit > 0) ? limit : 10;

        Long ownerScope = SecurityUtil.getPoiOwnerScopeUserIdOrNull();
        List<Object[]> topRows = narrationLogRepository.findTopPOIsByNarrationCount(
                fromInst, toExclusive, ownerScope, PageRequest.of(0, topLimit));

        Instant todayStart = today.atStartOfDay(z).toInstant();

        int[] rank = { 1 };
        return topRows.stream().map(row -> {
            Long poiId = ((Number) row[0]).longValue();
            Long cnt = ((Number) row[1]).longValue();
            POI poi = poiRepository.findById(poiId).orElse(null);
            long todayCount = poiId != null
                    ? narrationLogRepository.countByPoiIdSince(poiId, todayStart)
                    : 0L;
            ResTopPOIDTO dto = ResTopPOIDTO.of(
                    poiId,
                    poi != null ? poi.getFoodName() : null,
                    poi != null ? poi.getAddress() : null,
                    cnt,
                    todayCount,
                    rank[0]++);
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public ResTranslationStatsDTO getTranslationStats() {
        long total = translationTrainingRepository.count();
        long validated = translationTrainingRepository.countValidated();
        long pending = translationTrainingRepository.countPending();
        List<Object[]> stats = translationTrainingRepository.statsByLanguagePair();

        List<ResTranslationStatsDTO.LanguagePairStats> pairs = stats.stream().map(arr -> {
            String src = (String) arr[0];
            String tgt = (String) arr[1];
            long cnt = ((Number) arr[2]).longValue();
            Float avgConf = arr[3] != null ? ((Number) arr[3]).floatValue() : null;
            return ResTranslationStatsDTO.LanguagePairStats.builder()
                    .sourceLang(src)
                    .targetLang(tgt)
                    .totalSentences(cnt)
                    .avgConfidence(avgConf)
                    .build();
        }).collect(Collectors.toList());

        Float overall = translationTrainingRepository.avgConfidenceByLang("vi");

        return ResTranslationStatsDTO.builder()
                .totalCorpus(total)
                .validatedCount(validated)
                .pendingCount(pending)
                .overallAccuracy(overall)
                .languagePairs(pairs)
                .build();
    }

    @Override
    public ResLoadTestResultDTO startLoadTest(int concurrentUsers, int durationSeconds,
            int triggerRadiusMeters, Integer poiCount) {

        String testId = "load-test-" + System.currentTimeMillis();
        Instant startedAt = Instant.now();

        // Metrics
        AtomicInteger totalRequests = new AtomicInteger(0);
        AtomicInteger successRequests = new AtomicInteger(0);
        AtomicInteger failedRequests = new AtomicInteger(0);
        List<Long> latencies = java.util.Collections.synchronizedList(new ArrayList<>());
        AtomicLong sumLatency = new AtomicLong(0);

        // Phase latency tracking
        Map<String, List<Long>> phaseLatencies = new java.util.concurrent.ConcurrentHashMap<>();
        Arrays.asList("narration-check", "narration-log", "poi-fetch", "device-sync")
                .forEach(p -> phaseLatencies.put(p, new ArrayList<>()));

        List<POI> pois = poiCount != null && poiCount > 0
                ? poiRepository.findAll(org.springframework.data.domain.Pageable.ofSize(poiCount)).getContent()
                : poiRepository.findAll();
        Random random = new Random();

        ExecutorService executor = Executors.newFixedThreadPool(concurrentUsers);

        List<Callable<Void>> tasks = new ArrayList<>();
        for (int i = 0; i < concurrentUsers; i++) {
            tasks.add(() -> {
                long endTime = System.currentTimeMillis() + durationSeconds * 1000L;
                while (System.currentTimeMillis() < endTime) {
                    // Simulated device ID (used for test diversity, not actual API calls in mock
                    // mode)
                    @SuppressWarnings("unused")
                    String deviceId = "load-test-device-" + random.nextInt(10000);
                    double lat = 10.7624 + (random.nextDouble() - 0.5) * 0.01;
                    double lng = 106.6604 + (random.nextDouble() - 0.5) * 0.01;
                    int poiIdx = random.nextInt(Math.max(pois.size(), 1));
                    POI poi = pois.get(poiIdx);

                    // Phase 1: poi-fetch
                    long t0 = System.currentTimeMillis();
                    try {
                        if (poi.getLatitude() != null && poi.getLongitude() != null) {
                            // Simulate nearby lookup
                            double dist = java.lang.Math.sqrt(
                                    Math.pow(lat - poi.getLatitude(), 2) +
                                            Math.pow(lng - poi.getLongitude(), 2));
                            if (dist <= triggerRadiusMeters / 111000.0) {
                                // In range - count as success
                            }
                        }
                        long latency = System.currentTimeMillis() - t0;
                        recordLatency("poi-fetch", latency, latencies, sumLatency,
                                phaseLatencies, totalRequests, successRequests);
                    } catch (Exception e) {
                        recordFailure("poi-fetch", latencies, failedRequests, totalRequests);
                    }

                    // Phase 2: narration-check (mock)
                    t0 = System.currentTimeMillis();
                    try {
                        Thread.sleep(random.nextInt(20) + 10);
                        long latency = System.currentTimeMillis() - t0;
                        recordLatency("narration-check", latency, latencies, sumLatency,
                                phaseLatencies, totalRequests, successRequests);
                    } catch (Exception e) {
                        recordFailure("narration-check", latencies, failedRequests, totalRequests);
                    }

                    // Phase 3: narration-log (mock)
                    t0 = System.currentTimeMillis();
                    try {
                        Thread.sleep(random.nextInt(20) + 10);
                        long latency = System.currentTimeMillis() - t0;
                        recordLatency("narration-log", latency, latencies, sumLatency,
                                phaseLatencies, totalRequests, successRequests);
                    } catch (Exception e) {
                        recordFailure("narration-log", latencies, failedRequests, totalRequests);
                    }

                    // Random delay between iterations
                    try {
                        Thread.sleep(random.nextInt(500) + 100);
                    } catch (InterruptedException ignored) {
                    }
                }
                return null;
            });
        }

        try {
            executor.invokeAll(tasks);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            executor.shutdown();
        }

        Instant completedAt = Instant.now();
        long durationMs = completedAt.toEpochMilli() - startedAt.toEpochMilli();

        int total = totalRequests.get();
        int success = successRequests.get();
        int failed = failedRequests.get();

        double[] sorted = latencies.stream().mapToDouble(Long::doubleValue).sorted().toArray();
        double p50 = percentile(sorted, 0.50);
        double p95 = percentile(sorted, 0.95);
        double p99 = percentile(sorted, 0.99);
        double avg = total > 0 ? (double) sumLatency.get() / total : 0;

        List<PhaseLatency> phaseResults = phaseLatencies.entrySet().stream().map(e -> {
            List<Long> lats = e.getValue();
            double[] sortedPhase = lats.stream().mapToDouble(Long::doubleValue).sorted().toArray();
            int count = lats.size();
            return PhaseLatency.builder()
                    .phase(e.getKey())
                    .count(count)
                    .avgMs(count > 0 ? lats.stream().mapToLong(Long::longValue).average().orElse(0) : 0)
                    .p95Ms(percentile(sortedPhase, 0.95))
                    .errorRate(total > 0 ? (double) failed * 100 / total : 0)
                    .build();
        }).collect(Collectors.toList());

        return ResLoadTestResultDTO.builder()
                .testId(testId)
                .startedAt(startedAt)
                .completedAt(completedAt)
                .durationMs(durationMs)
                .concurrentUsers(concurrentUsers)
                .durationSeconds(durationSeconds)
                .totalRequests(total)
                .successfulRequests(success)
                .failedRequests(failed)
                .latencyP50(p50)
                .latencyP95(p95)
                .latencyP99(p99)
                .avgLatencyMs(avg)
                .minLatencyMs(sorted.length > 0 ? sorted[0] : 0)
                .maxLatencyMs(sorted.length > 0 ? sorted[sorted.length - 1] : 0)
                .throughputPerSecond(total * 1000.0 / Math.max(durationMs, 1))
                .errorRatePercent(total > 0 ? (double) failed * 100 / total : 0.0)
                .dbConnectionsUsed(10)
                .dbStatus("OK")
                .phaseLatencies(phaseResults)
                .build();
    }

    private void recordLatency(String phase, long latencyMs,
            List<Long> allLatencies, AtomicLong sumLatency,
            Map<String, List<Long>> phaseLatencies,
            AtomicInteger total, AtomicInteger success) {
        allLatencies.add(latencyMs);
        sumLatency.addAndGet(latencyMs);
        phaseLatencies.get(phase).add(latencyMs);
        total.incrementAndGet();
        success.incrementAndGet();
    }

    private void recordFailure(String phase, List<Long> latencies,
            AtomicInteger failed, AtomicInteger total) {
        latencies.add(5000L); // penalize failures
        failed.incrementAndGet();
        total.incrementAndGet();
    }

    private double percentile(double[] sorted, double p) {
        if (sorted.length == 0)
            return 0;
        int idx = (int) Math.ceil(p * sorted.length) - 1;
        return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
    }

    @Override
    public org.springframework.data.domain.Page<com.example.demo.domain.response.admin.ResAdminDeviceConfigDTO> getDeviceConfigs(
            org.springframework.data.domain.Pageable pageable) {
        return deviceConfigRepository.findAll(pageable)
                .map(d -> com.example.demo.domain.response.admin.ResAdminDeviceConfigDTO.builder()
                        .id(d.getId())
                        .deviceId(d.getDeviceId())
                        .osVersion(d.getOsVersion())
                        .appVersion(d.getAppVersion())
                        .ramMB(d.getRamMB())
                        .storageFreeMB(d.getStorageFreeMB())
                        .networkType(d.getNetworkType())
                        .offlineModeEnabled(d.getOfflineModeEnabled())
                        .totalDownloadedMB(d.getTotalDownloadedMB())
                        .lastLat(d.getLastLat())
                        .lastLng(d.getLastLng())
                        .lastSeenAt(d.getLastSeenAt())
                        .runningMode(d.getRunningMode())
                        .createdAt(d.getCreatedAt())
                        .updatedAt(d.getUpdatedAt())
                        .isActive(d.getIsActive())
                        .build());
    }

    @Override
    public long countActiveDeviceConfigs() {
        return deviceConfigRepository.countByIsActiveTrue();
    }

    @Override
    public ResOnlineStatsDTO getOnlineStats() {
        // Online ngay lúc này = heartbeat trong vòng 2 phút gần nhất
        Instant twoMinAgo = Instant.now().minusSeconds(15);
        long onlineNow = deviceConfigRepository.countOnlineNow(twoMinAgo);

        // Người dùng unique trong ngày (cứ mở app là tính)
        Instant todayStart = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();
        long usersToday = deviceConfigRepository.countActiveDevices(todayStart);

        // Đang phát ngay lúc này
        long playingNow = activeNarrationRepository.countCurrentlyPlayingOnline(twoMinAgo);

        // Lấy danh sách các thiết bị đang online có toạ độ
        java.util.List<ResOnlineStatsDTO.OnlineDevice> onlineDevices = deviceConfigRepository.findOnlineNowDevices(twoMinAgo)
                .stream()
                .filter(d -> d.getLastLat() != null && d.getLastLng() != null)
                .map(d -> ResOnlineStatsDTO.OnlineDevice.builder()
                        .deviceId(d.getDeviceId())
                        .lat(d.getLastLat())
                        .lng(d.getLastLng())
                        .build())
                .collect(java.util.stream.Collectors.toList());

        return ResOnlineStatsDTO.builder()
                .onlineNow(onlineNow)
                .usersToday(usersToday)
                .playingNow(playingNow)
                .onlineDevices(onlineDevices)
                .build();
    }
}

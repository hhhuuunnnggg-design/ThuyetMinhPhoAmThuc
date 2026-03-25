package com.example.demo.domain.response.admin;

import java.time.Instant;
import java.util.List;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResLoadTestResultDTO {

    String testId;
    Instant startedAt;
    Instant completedAt;
    Long durationMs;

    int concurrentUsers;
    int durationSeconds;
    int totalRequests;
    int successfulRequests;
    int failedRequests;

    // Latency (milliseconds)
    double latencyP50;
    double latencyP95;
    double latencyP99;
    double avgLatencyMs;
    double minLatencyMs;
    double maxLatencyMs;

    // Throughput
    double throughputPerSecond;

    // Error rate
    double errorRatePercent;

    // DB stats
    int dbConnectionsUsed;
    String dbStatus;

    List<PhaseLatency> phaseLatencies;

    @Data
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class PhaseLatency {
        String phase;       // "narration-check", "narration-log", "poi-fetch"
        int count;
        double avgMs;
        double p95Ms;
        double errorRate;
    }
}

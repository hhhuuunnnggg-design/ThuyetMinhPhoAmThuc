package com.example.demo.domain.response.admin;

import java.util.List;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResDashboardDTO {

    // Tổng quan
    long totalPOIs;
    long activePOIs;
    long totalDevices;
    long activeDevicesLast24h;
    long offlineModeDevices;

    // Narration
    long totalNarrationsToday;
    long currentlyPlaying;

    // Queue
    long activeSessions;

    // Revenue
    Long revenueToday;
    long paymentsPending;
    long paymentsSuccessToday;

    // Top POIs đang hot
    List<POIQueueCount> topActivePOIs;

    // Device breakdown
    long offlineModeCount;
    long streamingModeCount;

    @Data
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class POIQueueCount {
        Long poiId;
        String poiName;
        int activeCount;
        long todayCount;
        Long todayRevenue;
    }
}

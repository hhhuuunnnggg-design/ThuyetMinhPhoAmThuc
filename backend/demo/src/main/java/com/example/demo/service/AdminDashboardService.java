package com.example.demo.service;

import java.util.List;

import com.example.demo.domain.response.admin.ResDashboardDTO;
import com.example.demo.domain.response.admin.ResLoadTestResultDTO;
import com.example.demo.domain.response.admin.ResTranslationStatsDTO;

public interface AdminDashboardService {

    /**
     * Dashboard tổng quan toàn hệ thống.
     */
    ResDashboardDTO getDashboard();

    /**
     * Danh sách POI + số người đang nghe (cho admin theo dõi real-time).
     */
    List<ResDashboardDTO.POIQueueCount> getPOIQueueCounts();

    /**
     * Thống kê dịch thuật.
     */
    ResTranslationStatsDTO getTranslationStats();

    /**
     * Bắt đầu load test.
     */
    ResLoadTestResultDTO startLoadTest(int concurrentUsers, int durationSeconds,
            int triggerRadiusMeters, Integer poiCount);
}

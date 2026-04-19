package com.example.demo.service;

import java.time.LocalDate;
import java.util.List;

import com.example.demo.domain.response.app.ResActiveNarrationDTO;
import com.example.demo.domain.response.admin.ResDashboardDTO;
import com.example.demo.domain.response.admin.ResLoadTestResultDTO;
import com.example.demo.domain.response.admin.ResTopPOIDTO;
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
     * Đang phát — SUPER_ADMIN / is_admin xem hết; SHOP_OWNER chỉ bản ghi thuộc POI do họ tạo.
     */
    List<ResActiveNarrationDTO> getActiveNarrationsForAdmin();

    /**
     * Top POIs được nghe nhiều nhất (theo calendar ngày, timezone server).
     *
     * @param from  ngày bắt đầu (inclusive); nếu cả {@code from} và {@code to} đều null thì mặc định 7 ngày gần nhất
     * @param to    ngày kết thúc (inclusive)
     * @param limit số lượng kết quả trả về (mặc định 10)
     */
    List<ResTopPOIDTO> getTopPOIsByNarration(LocalDate from, LocalDate to, Integer limit);

    /**
     * Thống kê dịch thuật.
     */
    ResTranslationStatsDTO getTranslationStats();

    /**
     * Bắt đầu load test.
     */
    ResLoadTestResultDTO startLoadTest(int concurrentUsers, int durationSeconds,
            int triggerRadiusMeters, Integer poiCount);

    /**
     * Lấy log thiết bị quét QR theo page.
     */
    org.springframework.data.domain.Page<com.example.demo.domain.response.admin.ResAdminDeviceConfigDTO> getDeviceConfigs(org.springframework.data.domain.Pageable pageable);

    /**
     * Đếm tổng số thiết bị còn đang hoạt động.
     */
    long countActiveDeviceConfigs();
}

package com.example.demo.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.request.admin.ReqLoadTestDTO;
import com.example.demo.domain.response.admin.ResDashboardDTO;
import com.example.demo.domain.response.admin.ResLoadTestResultDTO;
import com.example.demo.domain.response.admin.ResTopPOIDTO;
import com.example.demo.domain.response.admin.ResTranslationStatsDTO;
import com.example.demo.domain.response.app.ResActiveNarrationDTO;
import com.example.demo.service.AdminDashboardService;
import com.example.demo.util.annotation.ApiMessage;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    public AdminDashboardController(AdminDashboardService adminDashboardService) {
        this.adminDashboardService = adminDashboardService;
    }

    @GetMapping("/dashboard")
    @ApiMessage("Dashboard tổng quan")
    public ResponseEntity<ResDashboardDTO> getDashboard() {
        return ResponseEntity.ok(adminDashboardService.getDashboard());
    }

    @GetMapping("/dashboard/poi-queue")
    @ApiMessage("Queue POI real-time")
    public ResponseEntity<List<ResDashboardDTO.POIQueueCount>> getPOIQueueCounts() {
        return ResponseEntity.ok(adminDashboardService.getPOIQueueCounts());
    }

    @GetMapping("/dashboard/active-narrations")
    @ApiMessage("Đang phát (admin / chủ quán theo POI của họ)")
    public ResponseEntity<List<ResActiveNarrationDTO>> getActiveNarrationsForAdmin() {
        return ResponseEntity.ok(adminDashboardService.getActiveNarrationsForAdmin());
    }

    /**
     * Top POIs được nghe nhiều nhất.
     *
     * @param from  Ngày bắt đầu (ISO yyyy-MM-dd, inclusive). Bỏ qua cùng {@code to} → mặc định 7 ngày gần nhất.
     * @param to    Ngày kết thúc (inclusive)
     * @param limit Số lượng kết quả trả về (mặc định 10)
     */
    @GetMapping("/dashboard/top-pois")
    @ApiMessage("Top POIs nghe nhiều nhất")
    public ResponseEntity<List<ResTopPOIDTO>> getTopPOIs(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(adminDashboardService.getTopPOIsByNarration(from, to, limit));
    }

    @GetMapping("/translation/stats")
    @ApiMessage("Thống kê dịch thuật")
    public ResponseEntity<ResTranslationStatsDTO> getTranslationStats() {
        return ResponseEntity.ok(adminDashboardService.getTranslationStats());
    }

    @PostMapping("/load-test/start")
    @ApiMessage("Bắt đầu load test")
    public ResponseEntity<ResLoadTestResultDTO> startLoadTest(@Valid @RequestBody ReqLoadTestDTO req) {
        return ResponseEntity.ok(adminDashboardService.startLoadTest(
                req.getConcurrentUsers(),
                req.getDurationSeconds(),
                req.getTriggerRadiusMeters() != null ? req.getTriggerRadiusMeters() : 50,
                req.getPoiCount()));
    }

    @GetMapping("/device-configs")
    @ApiMessage("Danh sách cấu hình thiết bị (Log)")
    public ResponseEntity<com.example.demo.domain.dto.ResultPaginationDTO> getDeviceConfigs(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        org.springframework.data.domain.Sort sort = sortDir.equalsIgnoreCase("asc")
                ? org.springframework.data.domain.Sort.by(sortBy).ascending()
                : org.springframework.data.domain.Sort.by(sortBy).descending();
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page - 1, size, sort);
        org.springframework.data.domain.Page<com.example.demo.domain.response.admin.ResAdminDeviceConfigDTO> devices = adminDashboardService.getDeviceConfigs(pageable);

        com.example.demo.domain.dto.ResultPaginationDTO response = new com.example.demo.domain.dto.ResultPaginationDTO();
        com.example.demo.domain.dto.ResultPaginationDTO.Meta meta = new com.example.demo.domain.dto.ResultPaginationDTO.Meta();
        meta.setPage(devices.getNumber() + 1);
        meta.setPageSize(devices.getSize());
        meta.setPages(devices.getTotalPages());
        meta.setTotal(devices.getTotalElements());
        response.setMeta(meta);
        response.setResult(devices.getContent());

        return ResponseEntity.ok(response);
    }
}

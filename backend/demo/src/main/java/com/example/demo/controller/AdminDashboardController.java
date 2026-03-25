package com.example.demo.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.request.admin.ReqLoadTestDTO;
import com.example.demo.domain.response.admin.ResDashboardDTO;
import com.example.demo.domain.response.admin.ResLoadTestResultDTO;
import com.example.demo.domain.response.admin.ResTranslationStatsDTO;
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
}

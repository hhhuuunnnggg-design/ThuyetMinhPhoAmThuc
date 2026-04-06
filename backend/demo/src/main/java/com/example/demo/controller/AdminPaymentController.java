package com.example.demo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.dto.ResultPaginationDTO;
import com.example.demo.domain.response.admin.ResAdminPaymentDTO;
import com.example.demo.domain.response.admin.ResAdminPaymentStatsDTO;
import com.example.demo.service.AdminPaymentService;
import com.example.demo.util.annotation.ApiMessage;
import com.example.demo.util.error.IdInvalidException;

@RestController
@RequestMapping("/api/v1/admin/payments")
public class AdminPaymentController {

    private final AdminPaymentService adminPaymentService;

    public AdminPaymentController(AdminPaymentService adminPaymentService) {
        this.adminPaymentService = adminPaymentService;
    }

    @GetMapping
    @ApiMessage("Danh sách thanh toán (admin)")
    public ResponseEntity<ResultPaginationDTO> listPayments(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String poiName,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long restaurantId) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), size, sort);
        Page<ResAdminPaymentDTO> payments = adminPaymentService.listPayments(
                pageable, poiName, userId, status, restaurantId);

        ResultPaginationDTO response = new ResultPaginationDTO();
        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        meta.setPage(payments.getNumber() + 1);
        meta.setPageSize(payments.getSize());
        meta.setPages(payments.getTotalPages());
        meta.setTotal(payments.getTotalElements());
        response.setMeta(meta);
        response.setResult(payments.getContent());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats/month")
    @ApiMessage("Thống kê thanh toán theo tháng (VN)")
    public ResponseEntity<ResAdminPaymentStatsDTO> statsMonth(
            @RequestParam(required = false) String month) {
        return ResponseEntity.ok(adminPaymentService.getStatsForMonthVietnam(month));
    }

    @PostMapping("/{id}/sync-payos")
    @ApiMessage("Đồng bộ trạng thái từ PayOS")
    public ResponseEntity<ResAdminPaymentDTO> syncPayOS(@PathVariable Long id) throws IdInvalidException {
        return ResponseEntity.ok(adminPaymentService.syncPaymentFromPayOS(id));
    }
}

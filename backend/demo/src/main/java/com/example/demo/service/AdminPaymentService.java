package com.example.demo.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.demo.domain.response.admin.ResAdminPaymentDTO;
import com.example.demo.domain.response.admin.ResAdminPaymentStatsDTO;
import com.example.demo.util.error.IdInvalidException;

public interface AdminPaymentService {

    Page<ResAdminPaymentDTO> listPayments(
            Pageable pageable,
            String poiName,
            String userId,
            String status,
            Long restaurantId);

    ResAdminPaymentStatsDTO getStatsForCurrentMonthVietnam();

    ResAdminPaymentDTO syncPaymentFromPayOS(Long paymentId) throws IdInvalidException;
}

package com.example.demo.service.impl;

import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.domain.POI;
import com.example.demo.domain.Payment;
import com.example.demo.domain.Payment.PaymentStatus;
import com.example.demo.domain.Restaurant;
import com.example.demo.domain.response.admin.ResAdminPaymentDTO;
import com.example.demo.domain.response.admin.ResAdminPaymentStatsDTO;
import com.example.demo.domain.response.admin.ResAdminPaymentStatsDTO.DailyRevenuePoint;
import com.example.demo.repository.PaymentRepository;
import com.example.demo.service.AdminPaymentService;
import com.example.demo.service.PayOSService;
import com.example.demo.service.spec.PaymentSpecifications;
import com.example.demo.util.error.IdInvalidException;

import vn.payos.model.v2.paymentRequests.PaymentLink;
import vn.payos.model.v2.paymentRequests.PaymentLinkStatus;

@Service
public class AdminPaymentServiceImpl implements AdminPaymentService {

    private static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");

    private final PaymentRepository paymentRepository;
    private final PayOSService payOSService;

    public AdminPaymentServiceImpl(PaymentRepository paymentRepository, PayOSService payOSService) {
        this.paymentRepository = paymentRepository;
        this.payOSService = payOSService;
    }

    @Override
    public Page<ResAdminPaymentDTO> listPayments(
            Pageable pageable,
            String poiName,
            String userId,
            String status,
            Long restaurantId) {
        PaymentStatus st = parseStatus(status);
        Specification<Payment> spec = Specification.allOf(
                PaymentSpecifications.poiNameContains(poiName),
                PaymentSpecifications.userIdContains(userId),
                PaymentSpecifications.statusEquals(st),
                PaymentSpecifications.restaurantIdEquals(restaurantId));
        return paymentRepository.findAll(spec, pageable).map(this::toDto);
    }

    @Override
    public ResAdminPaymentStatsDTO getStatsForCurrentMonthVietnam() {
        YearMonth ym = YearMonth.now(VN);
        Instant start = ym.atDay(1).atStartOfDay(VN).toInstant();
        Instant end = ym.plusMonths(1).atDay(1).atStartOfDay(VN).toInstant();

        Long revenue = paymentRepository.sumPaidAmountBetween(start, end);
        long completed = paymentRepository.countPaidBetween(start, end);

        EnumMap<PaymentStatus, Long> counts = new EnumMap<>(PaymentStatus.class);
        for (PaymentStatus ps : PaymentStatus.values()) {
            counts.put(ps, 0L);
        }
        List<Object[]> grouped = paymentRepository.countGroupedByStatusBetween(start, end);
        for (Object[] row : grouped) {
            if (row[0] instanceof PaymentStatus ps && row[1] instanceof Number n) {
                counts.put(ps, n.longValue());
            }
        }

        Map<Integer, Long> dayTotals = new TreeMap<>();
        List<Payment> paidInMonth = paymentRepository.findPaidSuccessBetween(start, end);
        for (Payment p : paidInMonth) {
            if (p.getPaidAt() == null) {
                continue;
            }
            ZonedDateTime z = p.getPaidAt().atZone(VN);
            if (z.getYear() == ym.getYear() && z.getMonth() == ym.getMonth()) {
                int dom = z.getDayOfMonth();
                dayTotals.merge(dom, p.getAmount() != null ? p.getAmount() : 0L, Long::sum);
            }
        }
        List<DailyRevenuePoint> daily = new ArrayList<>();
        for (int d = 1; d <= ym.lengthOfMonth(); d++) {
            daily.add(new DailyRevenuePoint(String.format("%02d", d), dayTotals.getOrDefault(d, 0L)));
        }

        long other = 0L;
        for (PaymentStatus ps : PaymentStatus.values()) {
            if (ps != PaymentStatus.PENDING
                    && ps != PaymentStatus.SUCCESS
                    && ps != PaymentStatus.CANCELLED
                    && ps != PaymentStatus.FAILED) {
                other += counts.getOrDefault(ps, 0L);
            }
        }

        return ResAdminPaymentStatsDTO.builder()
                .monthKey(ym.toString())
                .totalRevenueVnd(revenue != null ? revenue : 0L)
                .completedOrdersCount(completed)
                .pendingCount(counts.getOrDefault(PaymentStatus.PENDING, 0L))
                .successCount(counts.getOrDefault(PaymentStatus.SUCCESS, 0L))
                .cancelledCount(counts.getOrDefault(PaymentStatus.CANCELLED, 0L))
                .failedCount(counts.getOrDefault(PaymentStatus.FAILED, 0L))
                .otherStatusCount(other)
                .dailyRevenue(daily)
                .build();
    }

    @Override
    @Transactional
    public ResAdminPaymentDTO syncPaymentFromPayOS(Long paymentId) throws IdInvalidException {
        Payment payment = paymentRepository
                .findByIdWithGraph(paymentId)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy payment: " + paymentId));
        java.util.Optional<PaymentLink> linkOpt = payOSService.fetchPaymentLink(payment);
        if (linkOpt.isEmpty()) {
            throw new IdInvalidException(
                    "Không gọi được PayOS (thiếu credential / mock / chưa có orderCode hoặc paymentLinkId).");
        }
        applyPayosLinkStatus(payment, linkOpt.get());
        payment = paymentRepository.save(payment);
        return toDto(payment);
    }

    private void applyPayosLinkStatus(Payment payment, PaymentLink link) {
        PaymentLinkStatus st = link.getStatus();
        if (st == null) {
            return;
        }
        String tid = payment.getPayosTransactionId();
        if (tid == null || tid.isBlank()) {
            tid = link.getOrderCode() != null ? String.valueOf(link.getOrderCode()) : "payos";
        }
        switch (st) {
            case PAID -> payment.markSuccess(tid);
            case CANCELLED, EXPIRED -> payment.markCancelled();
            case FAILED -> payment.markFailed();
            case PENDING, UNDERPAID, PROCESSING -> {
                payment.setStatus(PaymentStatus.PENDING);
                payment.setUpdatedAt(Instant.now());
            }
            default -> {
                payment.setUpdatedAt(Instant.now());
            }
        }
    }

    private ResAdminPaymentDTO toDto(Payment p) {
        POI poi = p.getPoi();
        Restaurant r = p.getRestaurant();
        return ResAdminPaymentDTO.builder()
                .id(p.getId())
                .userId(p.getUserId())
                .poiId(poi != null ? poi.getId() : null)
                .poiName(poi != null ? poi.getFoodName() : null)
                .restaurantId(r != null ? r.getId() : null)
                .restaurantName(r != null ? r.getOwnerName() : null)
                .amount(p.getAmount())
                .quantity(p.getQuantity())
                .currency(p.getCurrency())
                .status(p.getStatus() != null ? p.getStatus().name() : null)
                .payosTransactionId(p.getPayosTransactionId())
                .payosPaymentLinkId(p.getPayosPaymentLinkId())
                .payosPaymentLink(p.getPayosPaymentLink())
                .paidAt(p.getPaidAt())
                .createdAt(p.getCreatedAt())
                .description(p.getDescription())
                .build();
    }

    private static PaymentStatus parseStatus(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        try {
            return PaymentStatus.valueOf(s.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}

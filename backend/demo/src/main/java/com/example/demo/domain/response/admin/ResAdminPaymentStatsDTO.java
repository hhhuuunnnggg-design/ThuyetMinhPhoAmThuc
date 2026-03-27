package com.example.demo.domain.response.admin;

import java.util.ArrayList;
import java.util.List;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResAdminPaymentStatsDTO {

    /** Tháng thống kê (theo giờ VN), dạng yyyy-MM */
    String monthKey;

    /** Tổng doanh thu VND — giao dịch SUCCESS có paidAt trong tháng */
    long totalRevenueVnd;

    /** Số đơn thanh toán thành công trong tháng */
    long completedOrdersCount;

    long pendingCount;
    long successCount;
    long cancelledCount;
    long failedCount;
    long otherStatusCount;

    @Builder.Default
    List<DailyRevenuePoint> dailyRevenue = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyRevenuePoint {
        /** dd (trong tháng) */
        String dayOfMonth;
        long amountVnd;
    }
}

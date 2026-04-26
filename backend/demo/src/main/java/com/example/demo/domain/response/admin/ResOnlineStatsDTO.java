package com.example.demo.domain.response.admin;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResOnlineStatsDTO {

    /** Số thiết bị đang online ngay lúc này (lastSeenAt ≤ 2 phút + isActive = true). */
    long onlineNow;

    /** Số người dùng unique trong ngày hôm nay (distinct deviceId từ active_narrations). */
    long usersToday;

    /** Số bản narration đang PLAYING ngay lúc này. */
    long playingNow;

    java.util.List<OnlineDevice> onlineDevices;

    @Data
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class OnlineDevice {
        String deviceId;
        Double lat;
        Double lng;
    }
}

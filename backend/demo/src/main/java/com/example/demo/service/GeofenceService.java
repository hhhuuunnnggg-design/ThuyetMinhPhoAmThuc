package com.example.demo.service;

import java.util.List;

import com.example.demo.domain.POI;
import com.example.demo.domain.response.app.ResNearbyPOIDTO;

/**
 * Geofence Engine: Tính toán POIs trong bán kính và xếp hạng ưu tiên.
 */
public interface GeofenceService {

    /**
     * Xếp hạng POIs trong bán kính theo thứ tự ưu tiên.
     * Thuật toán 3 cấp:
     *   1. Priority cao hơn → ưu tiên trước
     *   2. Khoảng cách gần hơn → ưu tiên hơn
     *   3. Khoảng cách tương đối (sâu trong bán kính) → ưu tiên hơn
     *
     * @param lat  Vĩ độ user
     * @param lng  Kinh độ user
     * @param pois Danh sách POIs cần xét
     * @return Danh sách đã sắp xếp (POI ưu tiên nhất đứng đầu)
     */
    List<RankedPOI> rankPOIs(double lat, double lng, List<POI> pois);

    /**
     * Tìm POI ưu tiên cao nhất trong bán kính.
     */
    RankedPOI findBestPOI(double lat, double lng, List<POI> pois);

    /**
     * Tính khoảng cách Haversine (mét).
     */
    double haversineDistance(double lat1, double lng1, double lat2, double lng2);

    /**
     * POI đã xếp hạng.
     */
    record RankedPOI(POI poi, double distanceMeters, double relativeDepth, double score) {
    }
}

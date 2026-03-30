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
     * Luật 3 cấp:
     *   1. isInside (distance ≤ triggerRadius)  →  chỉ POI trong vùng mới được xếp hạng
     *   2. Khoảng cách nhỏ nhất           →  yếu tố CHÍNH
     *   3. Priority cao hơn               →  tie-breaker khi khoảng cách bằng nhau
     *   4. id nhỏ hơn                     →  tie-breaker cuối cùng
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
     * Tính khoảng cách Haversine(mét) (từ user đến POI).
     */
    double haversineDistance(double lat1, double lng1, double lat2, double lng2);

    /**
     * POI đã xếp hạng (POI + khoảng cách + độ sâu + ưu tiên).
     * @param poi POI
     * @param distanceMeters Khoảng cách từ user đến POI (mét)
     * @param relativeDepth Độ sâu của POI (0.0 - 1.0)
     * @param priority Ưu tiên của POI (0 - 100)
     */
    record RankedPOI(POI poi, double distanceMeters, double relativeDepth, int priority) {
    }
}

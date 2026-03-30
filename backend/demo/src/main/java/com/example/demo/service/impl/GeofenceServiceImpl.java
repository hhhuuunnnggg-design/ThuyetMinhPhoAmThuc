package com.example.demo.service.impl;

import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.domain.POI;
import com.example.demo.service.GeofenceService;
import com.example.demo.service.GeofenceService.RankedPOI;

@Service
public class GeofenceServiceImpl implements GeofenceService {

    private static final double EARTH_RADIUS_M = 6_371_000;

    @Override
    public List<RankedPOI> rankPOIs(double lat, double lng, List<POI> pois) {
        return pois.stream()
                .filter(poi -> poi.getLatitude() != null && poi.getLongitude() != null)
                .map(poi -> {
                    // khoảng cách từ user đến POI
                    double dist = haversineDistance(lat, lng, poi.getLatitude(), poi.getLongitude());
                    // bán kính kích hoạt của POI
                    double radius = poi.getTriggerRadiusMeters() != null ? poi.getTriggerRadiusMeters() : 50.0;
                    // ưu tiên của POI
                    int priority = poi.getPriority() != null ? poi.getPriority() : 0;
                    // độ sâu của POI
                    double depth = radius > 0 ? (radius - dist) / radius : 0.0;
                    // tạo đối tượng RankedPOI
                    return new RankedPOI(poi, dist, depth, priority);
                })
                // chỉ xét POI trong bán kính kích hoạt
                .filter(rp -> rp.distanceMeters() <= (rp.poi().getTriggerRadiusMeters() != null
                        ? rp.poi().getTriggerRadiusMeters() : 50.0))
                // 1. Khoảng cách tăng dần  2. Priority giảm dần  3. id tăng dần
                // sắp xếp theo khoảng cách, ưu tiên, id
                .sorted(Comparator
                        .<RankedPOI>comparingDouble(RankedPOI::distanceMeters)
                        .thenComparingInt((RankedPOI rp) -> rp.priority()).reversed()
                        .thenComparingLong(rp -> rp.poi().getId() != null ? rp.poi().getId() : 0L))
                .toList();
    }

    @Override
    public RankedPOI findBestPOI(double lat, double lng, List<POI> pois) {
        return rankPOIs(lat, lng, pois).stream().findFirst().orElse(null);
    }

    @Override
    public double haversineDistance(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_M * c;
    }
}

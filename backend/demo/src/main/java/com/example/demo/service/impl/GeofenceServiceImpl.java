package com.example.demo.service.impl;

import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.domain.POI;
import com.example.demo.service.GeofenceService;
import com.example.demo.service.GeofenceService.RankedPOI;

@Service
public class GeofenceServiceImpl implements GeofenceService {

    /**
     * Bán kính trái đất (mét).
     */
    private static final double EARTH_RADIUS_M = 6_371_000;

    @Override
    public List<RankedPOI> rankPOIs(double lat, double lng, List<POI> pois) {
        return pois.stream()
                .filter(poi -> poi.getLatitude() != null && poi.getLongitude() != null)
                .map(poi -> {
                    double dist = haversineDistance(lat, lng, poi.getLatitude(), poi.getLongitude());
                    double radius = poi.getTriggerRadiusMeters() != null ? poi.getTriggerRadiusMeters() : 50.0;
                    double depth = radius > 0 ? (radius - dist) / radius : 0.0; // 0 = mép, 1 = tâm
                    int priority = poi.getPriority() != null ? poi.getPriority() : 0;
                    // score = priority*1_000_000 - distance + depth*10_000
                    double score = priority * 1_000_000.0 - dist + depth * 10_000.0;
                    return new RankedPOI(poi, dist, depth, score);
                })
                .filter(rp -> rp.distanceMeters() <= (rp.poi().getTriggerRadiusMeters() != null
                        ? rp.poi().getTriggerRadiusMeters() : 50.0))
                .sorted(Comparator.comparingDouble(RankedPOI::score).reversed())
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

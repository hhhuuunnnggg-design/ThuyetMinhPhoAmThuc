package com.example.demo.domain.response.admin;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResTopPOIDTO {

    Long poiId;
    String poiName;
    String address;
    Long totalListens;
    Long todayListens;
    Integer rank;

    public static ResTopPOIDTO of(Long poiId, String poiName, String address, Long totalListens, Long todayListens, int rank) {
        return ResTopPOIDTO.builder()
                .poiId(poiId)
                .poiName(poiName != null ? poiName : "POI #" + poiId)
                .address(address)
                .totalListens(totalListens != null ? totalListens : 0L)
                .todayListens(todayListens != null ? todayListens : 0L)
                .rank(rank)
                .build();
    }
}

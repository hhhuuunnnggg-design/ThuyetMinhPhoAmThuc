package com.example.demo.service.impl;

import java.time.Instant;
import java.util.Collections;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.domain.POI;
import com.example.demo.domain.request.admin.ReqUpsertPOIDTO;
import com.example.demo.domain.response.admin.ResAdminPOIDTO;
import com.example.demo.repository.POIRepository;
import com.example.demo.repository.RestaurantRepository;
import com.example.demo.repository.UserServiceRepository;
import com.example.demo.service.POIService;
import com.example.demo.util.SecurityUtil;
import com.example.demo.util.error.IdInvalidException;

@Service
@Transactional
public class POIServiceImpl implements POIService {

    private final POIRepository poiRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserServiceRepository userServiceRepository;

    public POIServiceImpl(
            POIRepository poiRepository,
            RestaurantRepository restaurantRepository,
            UserServiceRepository userServiceRepository) {
        this.poiRepository = poiRepository;
        this.restaurantRepository = restaurantRepository;
        this.userServiceRepository = userServiceRepository;
    }

    @Override
    public Page<ResAdminPOIDTO> getAllPOIs(Pageable pageable) {
        return resolveAdminPoiPage(pageable);
    }

    /**
     * SUPER_ADMIN / {@code is_admin}: tất cả POI.
     * SHOP_OWNER (và user đã đăng nhập khác không phải full admin): chỉ POI có {@code user_id} = mình.
     * Không có JWT: giữ hành vi cũ (xem tất cả) — phục vụ môi trường dev / permitAll.
     */
    private Page<ResAdminPOIDTO> resolveAdminPoiPage(Pageable pageable) {
        return SecurityUtil.getCurrentJwt()
                .map(jwt -> {
                    if (SecurityUtil.isFullAdminJwt(jwt)) {
                        return poiRepository.findPageForAdmin(pageable).map(ResAdminPOIDTO::from);
                    }
                    return SecurityUtil.getCurrentUserId()
                            .map(uid -> poiRepository.findPageForAdminByOwnerUserId(uid, pageable)
                                    .map(ResAdminPOIDTO::from))
                            .orElseGet(() -> new PageImpl<>(Collections.emptyList(), pageable, 0));
                })
                .orElseGet(() -> poiRepository.findPageForAdmin(pageable).map(ResAdminPOIDTO::from));
    }

    /** Chỉ full admin hoặc chủ POI (user tạo) mới được thao tác. */
    private void assertShopOwnerOrAdminAccess(POI poi) throws IdInvalidException {
        Optional<Jwt> jwtOpt = SecurityUtil.getCurrentJwt();
        if (jwtOpt.isEmpty()) {
            return;
        }
        Jwt jwt = jwtOpt.get();
        if (SecurityUtil.isFullAdminJwt(jwt)) {
            return;
        }
        Long uid = SecurityUtil.getCurrentUserId().orElse(null);
        if (uid == null) {
            throw new IdInvalidException("Không có quyền truy cập POI");
        }
        if (poi.getUser() == null || !uid.equals(poi.getUser().getId())) {
            throw new IdInvalidException("Bạn chỉ được thao tác POI do chính mình tạo");
        }
    }

    @Override
    public ResAdminPOIDTO getPOIById(Long id) throws IdInvalidException {
        POI poi = poiRepository.findDetailForAdmin(id)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy POI: " + id));
        assertShopOwnerOrAdminAccess(poi);
        return ResAdminPOIDTO.from(poi);
    }

    @Override
    public ResAdminPOIDTO createPOI(ReqUpsertPOIDTO req) throws IdInvalidException {
        POI poi = POI.builder()
                // Thông tin ẩm thực — thuộc về POI
                .foodName(req.getFoodName())
                .price(req.getPrice())
                .description(req.getDescription())
                .imageUrl(req.getImageUrl())
                // Vị trí
                .address(req.getAddress())
                .category(req.getCategory())
                .openHours(req.getOpenHours())
                .phone(req.getPhone())
                // GPS
                .latitude(req.getLatitude())
                .longitude(req.getLongitude())
                .accuracy(req.getAccuracy())
                .triggerRadiusMeters(req.getTriggerRadiusMeters())
                .priority(req.getPriority())
                // Trạng thái
                .isActive(true)
                .viewCount(0L)
                .likeCount(0L)
                .version(1)
                .createdAt(Instant.now())
                .build();

        poi.resolveQrCode();

        SecurityUtil.getCurrentUserId()
                .flatMap(userServiceRepository::findById)
                .ifPresent(poi::setUser);

        if (req.getRestaurantId() != null) {
            restaurantRepository.findById(req.getRestaurantId())
                    .ifPresent(r -> poi.setRestaurant(r));
        }

        POI saved = poiRepository.save(poi);
        POI reloaded = poiRepository.findDetailForAdmin(saved.getId())
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy POI: " + saved.getId()));
        return ResAdminPOIDTO.from(reloaded);
    }

    @Override
    public ResAdminPOIDTO updatePOI(Long id, ReqUpsertPOIDTO req) throws IdInvalidException {
        POI poi = poiRepository.findDetailForAdmin(id)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy POI: " + id));
        assertShopOwnerOrAdminAccess(poi);

        // Thông tin ẩm thực
        poi.setFoodName(req.getFoodName());
        poi.setPrice(req.getPrice());
        poi.setDescription(req.getDescription());
        poi.setImageUrl(req.getImageUrl());
        // Vị trí
        poi.setAddress(req.getAddress());
        poi.setCategory(req.getCategory());
        poi.setOpenHours(req.getOpenHours());
        poi.setPhone(req.getPhone());
        // GPS
        poi.setLatitude(req.getLatitude());
        poi.setLongitude(req.getLongitude());
        poi.setAccuracy(req.getAccuracy());
        poi.setTriggerRadiusMeters(req.getTriggerRadiusMeters());
        poi.setPriority(req.getPriority());
        poi.setUpdatedAt(Instant.now());

        if (req.getRestaurantId() != null) {
            restaurantRepository.findById(req.getRestaurantId())
                    .ifPresent(r -> poi.setRestaurant(r));
        } else {
            poi.setRestaurant(null);
        }

        POI saved = poiRepository.save(poi);
        POI reloaded = poiRepository.findDetailForAdmin(saved.getId())
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy POI: " + saved.getId()));
        return ResAdminPOIDTO.from(reloaded);
    }

    @Override
    public void deletePOI(Long id) throws IdInvalidException {
        POI poi = poiRepository.findDetailForAdmin(id)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy POI: " + id));
        assertShopOwnerOrAdminAccess(poi);
        poiRepository.deleteById(id);
    }
}

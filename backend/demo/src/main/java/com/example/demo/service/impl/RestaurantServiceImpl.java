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

import com.example.demo.domain.Restaurant;
import com.example.demo.domain.request.admin.ReqUpsertRestaurantDTO;
import com.example.demo.domain.response.admin.ResAdminRestaurantDTO;
import com.example.demo.repository.RestaurantRepository;
import com.example.demo.service.RestaurantService;
import com.example.demo.util.SecurityUtil;
import com.example.demo.util.error.IdInvalidException;

@Service
@Transactional
public class RestaurantServiceImpl implements RestaurantService {

    private final RestaurantRepository restaurantRepository;

    public RestaurantServiceImpl(RestaurantRepository restaurantRepository) {
        this.restaurantRepository = restaurantRepository;
    }

    @Override
    public Page<ResAdminRestaurantDTO> getAllRestaurants(Pageable pageable) {
        return resolveAdminRestaurantPage(pageable);
    }

    /**
     * Full admin: mọi nhà hàng. SHOP_OWNER: POI liên kết do mình tạo hoặc {@code ownerEmail} trùng JWT.
     * Không JWT: giữ hành vi cũ (tất cả) — dev.
     */
    private Page<ResAdminRestaurantDTO> resolveAdminRestaurantPage(Pageable pageable) {
        Optional<Jwt> jwtOpt = SecurityUtil.getCurrentJwt();
        if (jwtOpt.isEmpty()) {
            return restaurantRepository.findAll(pageable).map(ResAdminRestaurantDTO::from);
        }
        Jwt jwt = jwtOpt.get();
        if (SecurityUtil.isFullAdminJwt(jwt)) {
            return restaurantRepository.findAll(pageable).map(ResAdminRestaurantDTO::from);
        }
        Long uid = SecurityUtil.getCurrentUserId().orElse(null);
        String em = SecurityUtil.getCurrentUserEmailNormalized().orElse("");
        if (uid == null && em.isEmpty()) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }
        return restaurantRepository.findPageForShopOwner(uid, em, pageable).map(ResAdminRestaurantDTO::from);
    }

    private void assertRestaurantAccess(Restaurant r) throws IdInvalidException {
        Optional<Jwt> jwtOpt = SecurityUtil.getCurrentJwt();
        if (jwtOpt.isEmpty()) {
            return;
        }
        Jwt jwt = jwtOpt.get();
        if (SecurityUtil.isFullAdminJwt(jwt)) {
            return;
        }
        Long uid = SecurityUtil.getCurrentUserId().orElse(null);
        String em = SecurityUtil.getCurrentUserEmailNormalized().orElse("");
        boolean byPoi = r.getPoi() != null && r.getPoi().getUser() != null
                && uid != null && uid.equals(r.getPoi().getUser().getId());
        String ownerNorm = r.getOwnerEmail() == null ? "" : r.getOwnerEmail().trim().toLowerCase();
        boolean byEmail = !em.isEmpty() && em.equals(ownerNorm);
        if (byPoi || byEmail) {
            return;
        }
        throw new IdInvalidException("Bạn chỉ được thao tác nhà hàng liên quan đến tài khoản của mình");
    }

    /** Gắn email chủ quán theo JWT khi không phải full admin — tránh tạo/sửa hộ tài khoản khác. */
    private void applyShopOwnerRestaurantEmail(ReqUpsertRestaurantDTO req) throws IdInvalidException {
        Optional<Jwt> jwtOpt = SecurityUtil.getCurrentJwt();
        if (jwtOpt.isEmpty()) {
            return;
        }
        if (SecurityUtil.isFullAdminJwt(jwtOpt.get())) {
            return;
        }
        String em = SecurityUtil.getCurrentUserEmailNormalized()
                .orElseThrow(() -> new IdInvalidException("Không xác định được email đăng nhập"));
        req.setOwnerEmail(em);
    }

    @Override
    public ResAdminRestaurantDTO getRestaurantById(Long id) throws IdInvalidException {
        Restaurant r = restaurantRepository.findByIdWithPoiAndUser(id)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy nhà hàng: " + id));
        assertRestaurantAccess(r);
        return ResAdminRestaurantDTO.from(r);
    }

    @Override
    public ResAdminRestaurantDTO createRestaurant(ReqUpsertRestaurantDTO req) throws IdInvalidException {
        applyShopOwnerRestaurantEmail(req);
        Restaurant r = Restaurant.builder()
                .ownerName(req.getOwnerName())
                .ownerEmail(req.getOwnerEmail())
                .ownerPhone(req.getOwnerPhone())
                .payosClientId(req.getPayosClientId())
                .payosApiKey(req.getPayosApiKey())
                .payosChecksumKey(req.getPayosChecksumKey())
                .bankAccount(req.getBankAccount())
                .bankName(req.getBankName())
                .commissionRate(req.getCommissionRate() != null ? req.getCommissionRate() : 0.05f)
                .isVerified(false)
                .createdAt(Instant.now())
                .build();

        r = restaurantRepository.save(r);
        return ResAdminRestaurantDTO.from(r);
    }

    @Override
    public ResAdminRestaurantDTO updateRestaurant(Long id, ReqUpsertRestaurantDTO req) throws IdInvalidException {
        Restaurant r = restaurantRepository.findByIdWithPoiAndUser(id)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy nhà hàng: " + id));
        assertRestaurantAccess(r);
        applyShopOwnerRestaurantEmail(req);

        r.setOwnerName(req.getOwnerName());
        r.setOwnerEmail(req.getOwnerEmail());
        r.setOwnerPhone(req.getOwnerPhone());
        r.setPayosClientId(req.getPayosClientId());
        r.setPayosApiKey(req.getPayosApiKey());
        r.setPayosChecksumKey(req.getPayosChecksumKey());
        r.setBankAccount(req.getBankAccount());
        r.setBankName(req.getBankName());
        if (req.getCommissionRate() != null) {
            r.setCommissionRate(req.getCommissionRate());
        }
        r.setUpdatedAt(Instant.now());

        r = restaurantRepository.save(r);
        return ResAdminRestaurantDTO.from(r);
    }

    @Override
    public void deleteRestaurant(Long id) throws IdInvalidException {
        Restaurant r = restaurantRepository.findByIdWithPoiAndUser(id)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy nhà hàng: " + id));
        assertRestaurantAccess(r);
        restaurantRepository.delete(r);
    }
}

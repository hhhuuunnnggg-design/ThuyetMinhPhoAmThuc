package com.example.demo.service.impl;

import java.time.Instant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.domain.Restaurant;
import com.example.demo.domain.request.admin.ReqUpsertRestaurantDTO;
import com.example.demo.domain.response.admin.ResAdminRestaurantDTO;
import com.example.demo.repository.RestaurantRepository;
import com.example.demo.service.RestaurantService;
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
        return restaurantRepository.findAll(pageable)
                .map(ResAdminRestaurantDTO::from);
    }

    @Override
    public ResAdminRestaurantDTO getRestaurantById(Long id) throws IdInvalidException {
        Restaurant r = restaurantRepository.findById(id)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy nhà hàng: " + id));
        return ResAdminRestaurantDTO.from(r);
    }

    @Override
    public ResAdminRestaurantDTO createRestaurant(ReqUpsertRestaurantDTO req) throws IdInvalidException {
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
        Restaurant r = restaurantRepository.findById(id)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy nhà hàng: " + id));

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
        if (!restaurantRepository.existsById(id)) {
            throw new IdInvalidException("Không tìm thấy nhà hàng: " + id);
        }
        restaurantRepository.deleteById(id);
    }
}

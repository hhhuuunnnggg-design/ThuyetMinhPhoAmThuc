package com.example.demo.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.demo.domain.request.admin.ReqUpsertRestaurantDTO;
import com.example.demo.domain.response.admin.ResAdminRestaurantDTO;
import com.example.demo.util.error.IdInvalidException;

public interface RestaurantService {

    Page<ResAdminRestaurantDTO> getAllRestaurants(Pageable pageable);

    ResAdminRestaurantDTO getRestaurantById(Long id) throws IdInvalidException;

    ResAdminRestaurantDTO createRestaurant(ReqUpsertRestaurantDTO req) throws IdInvalidException;

    ResAdminRestaurantDTO updateRestaurant(Long id, ReqUpsertRestaurantDTO req) throws IdInvalidException;

    void deleteRestaurant(Long id) throws IdInvalidException;
}

package com.example.demo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.dto.ResultPaginationDTO;
import com.example.demo.domain.request.admin.ReqUpsertRestaurantDTO;
import com.example.demo.domain.response.admin.ResAdminRestaurantDTO;
import com.example.demo.service.RestaurantService;
import com.example.demo.util.annotation.ApiMessage;
import com.example.demo.util.error.IdInvalidException;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/admin/restaurants")
public class RestaurantController {

    private final RestaurantService restaurantService;

    public RestaurantController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @GetMapping
    @ApiMessage("Danh sách nhà hàng")
    public ResponseEntity<ResultPaginationDTO> getAllRestaurants(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page - 1, size, sort);
        Page<ResAdminRestaurantDTO> restaurants = restaurantService.getAllRestaurants(pageable);

        ResultPaginationDTO response = new ResultPaginationDTO();
        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        meta.setPage(restaurants.getNumber() + 1);
        meta.setPageSize(restaurants.getSize());
        meta.setPages(restaurants.getTotalPages());
        meta.setTotal(restaurants.getTotalElements());
        response.setMeta(meta);
        response.setResult(restaurants.getContent());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @ApiMessage("Chi tiết nhà hàng")
    public ResponseEntity<ResAdminRestaurantDTO> getRestaurantById(@PathVariable Long id)
            throws IdInvalidException {
        ResAdminRestaurantDTO restaurant = restaurantService.getRestaurantById(id);
        return ResponseEntity.ok(restaurant);
    }

    @PostMapping
    @ApiMessage("Tạo nhà hàng mới")
    public ResponseEntity<ResAdminRestaurantDTO> createRestaurant(
            @Valid @RequestBody ReqUpsertRestaurantDTO req) throws IdInvalidException {
        ResAdminRestaurantDTO created = restaurantService.createRestaurant(req);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    @ApiMessage("Cập nhật nhà hàng")
    public ResponseEntity<ResAdminRestaurantDTO> updateRestaurant(
            @PathVariable Long id,
            @Valid @RequestBody ReqUpsertRestaurantDTO req) throws IdInvalidException {
        ResAdminRestaurantDTO updated = restaurantService.updateRestaurant(id, req);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Xóa nhà hàng")
    public ResponseEntity<Void> deleteRestaurant(@PathVariable Long id) throws IdInvalidException {
        restaurantService.deleteRestaurant(id);
        return ResponseEntity.ok().build();
    }
}

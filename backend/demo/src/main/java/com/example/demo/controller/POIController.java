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
import com.example.demo.domain.request.admin.ReqUpsertPOIDTO;
import com.example.demo.domain.response.admin.ResAdminPOIDTO;
import com.example.demo.service.POIService;
import com.example.demo.util.annotation.ApiMessage;
import com.example.demo.util.error.IdInvalidException;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/admin/pois")
public class POIController {

    private final POIService poiService;

    public POIController(POIService poiService) {
        this.poiService = poiService;
    }

    @GetMapping
    @ApiMessage("Danh sách POIs")
    public ResponseEntity<ResultPaginationDTO> getAllPOIs(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page - 1, size, sort);
        Page<ResAdminPOIDTO> pois = poiService.getAllPOIs(pageable);

        ResultPaginationDTO response = new ResultPaginationDTO();
        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        meta.setPage(pois.getNumber() + 1);
        meta.setPageSize(pois.getSize());
        meta.setPages(pois.getTotalPages());
        meta.setTotal(pois.getTotalElements());
        response.setMeta(meta);
        response.setResult(pois.getContent());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @ApiMessage("Chi tiết POI")
    public ResponseEntity<ResAdminPOIDTO> getPOIById(@PathVariable Long id) throws IdInvalidException {
        ResAdminPOIDTO poi = poiService.getPOIById(id);
        return ResponseEntity.ok(poi);
    }

    @PostMapping
    @ApiMessage("Tạo POI mới")
    public ResponseEntity<ResAdminPOIDTO> createPOI(@Valid @RequestBody ReqUpsertPOIDTO req)
            throws IdInvalidException {
        ResAdminPOIDTO created = poiService.createPOI(req);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    @ApiMessage("Cập nhật POI")
    public ResponseEntity<ResAdminPOIDTO> updatePOI(@PathVariable Long id,
            @Valid @RequestBody ReqUpsertPOIDTO req) throws IdInvalidException {
        ResAdminPOIDTO updated = poiService.updatePOI(id, req);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Xóa POI")
    public ResponseEntity<Void> deletePOI(@PathVariable Long id) throws IdInvalidException {
        poiService.deletePOI(id);
        return ResponseEntity.ok().build();
    }
}

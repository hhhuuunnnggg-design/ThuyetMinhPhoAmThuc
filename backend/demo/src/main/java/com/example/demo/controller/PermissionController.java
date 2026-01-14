package com.example.demo.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
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

import com.example.demo.domain.Permission;
import com.example.demo.domain.dto.ResultPaginationDTO;
import com.example.demo.domain.request.Permission.UpsertPermissionDTO;
import com.example.demo.service.PermissionService;
import com.example.demo.util.annotation.ApiMessage;
import com.example.demo.util.error.IdInvalidException;
import com.turkraft.springfilter.boot.Filter;

import jakarta.validation.Valid;

@RestController
@RequestMapping(value = "/api/v1/permissions")
public class PermissionController {

    private final PermissionService permissionService;

    public PermissionController(PermissionService permissionService) {
        this.permissionService = permissionService;
    }

    @PostMapping("/create")
    @ApiMessage("Create a permission")
    public ResponseEntity<Permission> create(@Valid @RequestBody UpsertPermissionDTO createPermissionDTO)
            throws IdInvalidException {
        Permission createdPermission = this.permissionService.createFromDTO(createPermissionDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPermission);
    }

    @PutMapping("/{id}")
    @ApiMessage("Update a permission")
    public ResponseEntity<Permission> update(@Valid @PathVariable Long id,
            @RequestBody UpsertPermissionDTO upsertPermissionDTO)
            throws IdInvalidException {
        Permission updatedPermission = this.permissionService.updatePermissionFromDTO(id, upsertPermissionDTO);
        return ResponseEntity.ok().body(updatedPermission);
    }

    @DeleteMapping("/{id}")
    @ApiMessage("delete a permission")
    public ResponseEntity<Map<String, String>> delete(@PathVariable("id") long id) throws IdInvalidException {
        this.permissionService.delete(id);

        Map<String, String> data = new HashMap<>();
        data.put("message", "Đã xóa thành công");
        return ResponseEntity.ok().body(data);
    }

    @GetMapping("/fetch-all")
    @ApiMessage("Fetch permissions")
    public ResponseEntity<ResultPaginationDTO> getPermissions(
            @Filter Specification<Permission> spec,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "100") int size) {

        // Convert one-based page to zero-based for Spring Boot
        Pageable pageable = PageRequest.of(page - 1, size);

        return ResponseEntity.status(HttpStatus.OK).body(
                this.permissionService.getPermissions(spec, pageable));
    }
}

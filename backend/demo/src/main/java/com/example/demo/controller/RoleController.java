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

import com.example.demo.domain.Role;
import com.example.demo.domain.dto.ResultPaginationDTO;
import com.example.demo.domain.request.Role.UpsertRoleDTO;
import com.example.demo.service.ApiPermissionService;
import com.example.demo.service.RoleService;
import com.example.demo.util.annotation.ApiMessage;
import com.example.demo.util.error.IdInvalidException;
import com.turkraft.springfilter.boot.Filter;

import jakarta.validation.Valid;

@RestController
@RequestMapping(value = "/api/v1/roles")
public class RoleController {

    private final RoleService roleService;
    private final ApiPermissionService apiPermissionService;

    public RoleController(RoleService roleService, ApiPermissionService apiPermissionService) {
        this.roleService = roleService;
        this.apiPermissionService = apiPermissionService;
    }

    @PostMapping("/create")
    @ApiMessage("Create a role")
    public ResponseEntity<Role> create(@Valid @RequestBody UpsertRoleDTO createRoleDTO) throws IdInvalidException {
        Role createdRole = this.roleService.createFromDTO(createRoleDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdRole);
    }

    @PutMapping("/{id}")
    @ApiMessage("Update a role")
    public ResponseEntity<Role> update(@Valid @PathVariable Long id, @RequestBody UpsertRoleDTO upsertRole)
            throws IdInvalidException {
        Role updatedRole = this.roleService.updateRoleFromDTO(id, upsertRole);
        return ResponseEntity.ok().body(updatedRole);
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Delete a role")
    public ResponseEntity<Map<String, String>> delete(@PathVariable("id") long id) throws IdInvalidException {
        this.roleService.delete(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Đã xóa thành công");
        return ResponseEntity.ok().body(response);
    }

    @GetMapping("/fetch-all")
    @ApiMessage("fetch all roles")
    public ResponseEntity<ResultPaginationDTO> getAllRoles(
            @Filter Specification<Role> spec,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "100") int size) {

        apiPermissionService.assertHasPermission("/api/v1/roles/fetch-all", "GET");

        // Convert one-based page to zero-based for Spring Boot
        Pageable pageable = PageRequest.of(page - 1, size);

        return ResponseEntity.status(HttpStatus.OK).body(
                this.roleService.getRoles(spec, pageable));
    }

}

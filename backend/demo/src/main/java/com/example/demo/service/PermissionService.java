package com.example.demo.service;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.example.demo.domain.Permission;
import com.example.demo.domain.dto.ResultPaginationDTO;
import com.example.demo.domain.request.Permission.UpsertPermissionDTO;
import com.example.demo.util.error.IdInvalidException;

public interface PermissionService {

    boolean isPermissionExist(Permission p);

    Permission fetchById(long id);

    Permission create(Permission p);

    Permission createFromDTO(UpsertPermissionDTO dto) throws IdInvalidException;

    Permission updatePermission(Permission p);

    Permission updatePermissionFromDTO(long id, UpsertPermissionDTO dto) throws IdInvalidException;

    void delete(long id) throws IdInvalidException;

    ResultPaginationDTO getPermissions(Specification<Permission> spec, Pageable pageable);
}

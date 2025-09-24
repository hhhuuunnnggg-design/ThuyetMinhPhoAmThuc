package com.example.demo.service;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.example.demo.domain.Permission;
import com.example.demo.domain.dto.ResultPaginationDTO;

public interface PermissionService {

    boolean isPermissionExist(Permission p);

    Permission fetchById(long id);

    Permission create(Permission p);

    Permission updatePermission(Permission p);

    void delete(long id);

    ResultPaginationDTO getPermissions(Specification<Permission> spec, Pageable pageable);
}

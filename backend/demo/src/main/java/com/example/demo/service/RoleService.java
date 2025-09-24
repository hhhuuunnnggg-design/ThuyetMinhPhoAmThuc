package com.example.demo.service;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.example.demo.domain.Role;
import com.example.demo.domain.dto.ResultPaginationDTO;

public interface RoleService {

    boolean existByName(String name);

    Role create(Role r);

    Role fetchById(long id);

    Role updateRole(Role r);

    void delete(long id);

    ResultPaginationDTO getRoles(Specification<Role> spec, Pageable pageable);
}

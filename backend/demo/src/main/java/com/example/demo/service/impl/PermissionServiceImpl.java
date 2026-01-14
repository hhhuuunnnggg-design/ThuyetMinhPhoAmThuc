package com.example.demo.service.impl;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.example.demo.domain.Permission;
import com.example.demo.domain.dto.ResultPaginationDTO;
import com.example.demo.domain.request.Permission.UpsertPermissionDTO;
import com.example.demo.repository.PermissionRepository;
import com.example.demo.service.PermissionService;
import com.example.demo.util.error.IdInvalidException;

@Service
public class PermissionServiceImpl implements PermissionService {

    private final PermissionRepository permissionRepository;

    public PermissionServiceImpl(PermissionRepository permissionRepository) {
        this.permissionRepository = permissionRepository;
    }

    @Override
    public boolean isPermissionExist(Permission p) {
        return permissionRepository.existsByModuleAndApiPathAndMethod(
                p.getModule(),
                p.getApiPath(),
                p.getMethod());
    }

    @Override
    public Permission fetchById(long id) {
        Optional<Permission> permissionOptional = this.permissionRepository.findById(id);
        if (permissionOptional.isPresent())
            return permissionOptional.get();
        return null;
    }

    @Override
    public Permission create(Permission p) {
        return this.permissionRepository.save(p);
    }

    @Override
    public Permission createFromDTO(UpsertPermissionDTO dto) throws IdInvalidException {
        // Map từ DTO sang Entity
        Permission newPermission = new Permission();
        newPermission.setName(dto.getName());
        newPermission.setApiPath(dto.getApiPath());
        newPermission.setMethod(dto.getMethod());
        newPermission.setModule(dto.getModule());

        // check exist
        if (this.isPermissionExist(newPermission)) {
            throw new IdInvalidException("Permission đã tồn tại.");
        }

        return this.permissionRepository.save(newPermission);
    }

    @Override
    public Permission updatePermission(Permission p) {
        Permission permissionDB = this.fetchById(p.getId());
        if (permissionDB != null) {
            permissionDB.setName(p.getName());
            permissionDB.setApiPath(p.getApiPath());
            permissionDB.setMethod(p.getMethod());
            permissionDB.setModule(p.getModule());

            permissionDB = this.permissionRepository.save(permissionDB);
            return permissionDB;
        }
        return null;
    }

    @Override
    public Permission updatePermissionFromDTO(long id, UpsertPermissionDTO dto) throws IdInvalidException {
        // check exist by id
        Permission existingPermission = this.fetchById(id);
        if (existingPermission == null) {
            throw new IdInvalidException("Permission với id = " + id + " không tồn tại.");
        }

        // Map từ DTO sang Entity
        Permission permissionToUpdate = new Permission();
        permissionToUpdate.setId(id);
        permissionToUpdate.setName(dto.getName());
        permissionToUpdate.setApiPath(dto.getApiPath());
        permissionToUpdate.setMethod(dto.getMethod());
        permissionToUpdate.setModule(dto.getModule());

        // check exist by module, apiPath and method (chỉ check nếu có thay đổi)
        boolean hasChanged = !existingPermission.getModule().equals(permissionToUpdate.getModule()) ||
                !existingPermission.getApiPath().equals(permissionToUpdate.getApiPath()) ||
                !existingPermission.getMethod().equals(permissionToUpdate.getMethod());

        if (hasChanged && this.isPermissionExist(permissionToUpdate)) {
            throw new IdInvalidException("Permission đã tồn tại.");
        }

        return this.updatePermission(permissionToUpdate);
    }

    @Override
    public void delete(long id) throws IdInvalidException {
        Optional<Permission> permissionOptional = this.permissionRepository.findById(id);
        if (permissionOptional.isEmpty()) {
            throw new IdInvalidException("Permission với id = " + id + " không tồn tại.");
        }

        Permission currentPermission = permissionOptional.get();
        currentPermission.getRoles().forEach(role -> role.getPermissions().remove(currentPermission));
        this.permissionRepository.delete(currentPermission);
    }

    @Override
    public ResultPaginationDTO getPermissions(Specification<Permission> spec, Pageable pageable) {
        Page<Permission> pPermissions = this.permissionRepository.findAll(spec, pageable);
        ResultPaginationDTO rs = new ResultPaginationDTO();
        ResultPaginationDTO.Meta mt = new ResultPaginationDTO.Meta();

        mt.setPage(pageable.getPageNumber() + 1);
        mt.setPageSize(pageable.getPageSize());

        mt.setPages(pPermissions.getTotalPages());
        mt.setTotal(pPermissions.getTotalElements());

        rs.setMeta(mt);
        rs.setResult(pPermissions.getContent());
        return rs;
    }
}

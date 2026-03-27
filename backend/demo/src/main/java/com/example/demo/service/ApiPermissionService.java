package com.example.demo.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.Permission;
import com.example.demo.domain.Role;
import com.example.demo.domain.User;
import com.example.demo.util.SecurityUtil;

@Service
public class ApiPermissionService {

    private final UserServices userServices;

    public ApiPermissionService(UserServices userServices) {
        this.userServices = userServices;
    }

    /**
     * So khớp đúng apiPath + method với bảng permissions của role (giống PermissionInterceptor cũ).
     */
    @Transactional(readOnly = true)
    public void assertHasPermission(String apiPath, String httpMethod) {
        String email = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Chưa đăng nhập"));

        User user = userServices.handleGetUserWithRolePermissions(email);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Không tìm thấy người dùng");
        }

        Role role = user.getRole();
        if (role == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản chưa được gán vai trò");
        }

        List<Permission> permissions = role.getPermissions();
        if (permissions == null || permissions.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không có quyền truy cập");
        }

        boolean allowed = permissions.stream()
                .anyMatch(p -> httpMethod.equalsIgnoreCase(p.getMethod()) && apiPath.equals(p.getApiPath()));

        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Bạn không có quyền truy cập chức năng này");
        }
    }
}

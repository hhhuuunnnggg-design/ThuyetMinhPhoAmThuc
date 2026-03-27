package com.example.demo.service;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.example.demo.domain.User;
import com.example.demo.domain.dto.ResultPaginationDTO;
import com.example.demo.domain.request.User.UpsertAdminDTO;
import com.example.demo.domain.response.ResCreateUserDTO;
import com.example.demo.domain.response.ResUpdateUserDTO;
import com.example.demo.domain.response.ResUserDTO;
import com.example.demo.util.error.IdInvalidException;

public interface UserServices {

    User handleGetUserByUsernames(String username);

    User handleGetUserByUsername(String username);

    /**
     * User kèm role + permissions (JOIN FETCH) — dùng cho login/account và kiểm tra quyền.
     */
    User handleGetUserWithRolePermissions(String email);

    void updateUserToken(String token, String email);

    User getUserByRefreshTokenAndEmail(String token, String email);

    boolean isEmailExist(String email);

    User handleCreateUser(User user);

    ResCreateUserDTO convertToResCreateUserDTO(User user);

    User handleFindByIdUser(Long id);

    ResUserDTO convertToResUserDTO(User user);

    User handleChangeActivityUser(Long id);

    User handleUpdateUser(User updateUser);

    ResUpdateUserDTO convertToResUpdateUserDTO(User user);

    void handleDeleteUser(Long id);

    void handleSaveImg(User user);

    ResultPaginationDTO fetchAllUsers(Specification<User> spec, Pageable pageable);

    User handleAdminCreateUser(UpsertAdminDTO dto) throws IdInvalidException;

    User handleAdminUpdateUser(Long id, UpsertAdminDTO dto) throws IdInvalidException;
}

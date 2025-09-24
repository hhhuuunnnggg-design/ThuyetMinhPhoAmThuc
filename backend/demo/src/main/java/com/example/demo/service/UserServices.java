package com.example.demo.service;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.example.demo.domain.User;
import com.example.demo.domain.dto.ResultPaginationDTO;
import com.example.demo.domain.response.ResCreateUserDTO;
import com.example.demo.domain.response.ResUpdateUserDTO;
import com.example.demo.domain.response.ResUserDTO;

public interface UserServices {

    User handleGetUserByUsernames(String username);

    User getUserByPostId(Long postId);

    User handleGetUserByUsername(String username);

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
}

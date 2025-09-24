package com.example.demo.service.impl;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.example.demo.domain.Role;
import com.example.demo.domain.User;
import com.example.demo.domain.dto.ResultPaginationDTO;
import com.example.demo.domain.response.ResCreateUserDTO;
import com.example.demo.domain.response.ResUpdateUserDTO;
import com.example.demo.domain.response.ResUserDTO;
import com.example.demo.repository.UserServiceRepository;
import com.example.demo.service.RoleService;
import com.example.demo.service.UserServices;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE)
@AllArgsConstructor
public class UserServicesImpl implements UserServices {
    @Autowired
    UserServiceRepository userServiceRepository;

    @Autowired
    RoleService roleService;

    @Override
    public User handleGetUserByUsernames(String username) {
        User user = this.userServiceRepository.findByEmail(username);
        if (user == null) {
            throw new RuntimeException("User với email " + username + " không tồn tại");
        }
        if (user.isBlocked()) {
            throw new RuntimeException("Tài khoản đã bị khóa. Vui lòng liên hệ admin.");
        }
        return user;
    }

    @Override
    public User handleGetUserByUsername(String username) {
        return this.userServiceRepository.findByEmail(username);
    }

    @Override
    public void updateUserToken(String token, String email) {
        User currentUser = this.handleGetUserByUsername(email);
        if (currentUser != null) {
            currentUser.setRefreshToken(token);
            this.userServiceRepository.save(currentUser);
        }
    }

    @Override
    public User getUserByRefreshTokenAndEmail(String token, String email) {
        return this.userServiceRepository.findByRefreshTokenAndEmail(token, email);
    }

    @Override
    public boolean isEmailExist(String email) {
        return this.userServiceRepository.existsByEmail(email);
    }

    @Override
    public User handleCreateUser(User user) {
        if (user.getRole() != null) {
            Role r = this.roleService.fetchById(user.getRole().getId());
            user.setRole(r != null ? r : null);
        }
        return this.userServiceRepository.save(user);
    }

    @Override
    public ResCreateUserDTO convertToResCreateUserDTO(User user) {
        ResCreateUserDTO rs = new ResCreateUserDTO();
        rs.setId(user.getId());
        rs.setEmail(user.getEmail());
        rs.setGender(user.getGender());
        rs.setFullName(user.getLastName() + " " + user.getFirstName());
        rs.setCreatedAt(user.getCreatedAt());
        return rs;
    }

    @Override
    public User handleFindByIdUser(Long id) {
        Optional<User> UserOption = this.userServiceRepository.findById(id);
        if (UserOption.isPresent()) {
            return UserOption.get();
        }
        return null;
    }

    @Override
    public ResUserDTO convertToResUserDTO(User user) {
        ResUserDTO.RoleUser roleUser = null;
        if (user.getRole() != null) {
            roleUser = ResUserDTO.RoleUser.builder()
                    .id(user.getRole().getId())
                    .name(user.getRole().getName())
                    .build();
        }

        return ResUserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .avatar(user.getAvatar())
                .coverPhoto(user.getCoverPhoto())
                .fullname(user.getFirstName() + " " + user.getLastName())
                .dateOfBirth(user.getDateOfBirth())
                .gender(user.getGender())
                .work(user.getWork())
                .education(user.getEducation())
                .currentCity(user.getCurrent_city())
                .hometown(user.getHometown())
                .bio(user.getBio())
                .createdAt(user.getCreatedAt())
                .isAdmin(user.getIs_admin())
                .isBlocked(user.isBlocked())
                .role(roleUser)
                .build();
    }

    @Override
    public User handleChangeActivityUser(Long id) {
        User currentUser = this.handleFindByIdUser(id);
        if (currentUser != null) {
            currentUser.setIs_blocked(!currentUser.isBlocked());
            return this.userServiceRepository.save(currentUser);
        }
        return null;
    }

    @Override
    public User handleUpdateUser(User updateUser) {
        User currentUser = this.handleFindByIdUser(updateUser.getId());
        if (currentUser != null) {

            if (updateUser.getEmail() != null && !updateUser.getEmail().isBlank()) {
                currentUser.setEmail(updateUser.getEmail());
            }

            if (updateUser.getAvatar() != null && !updateUser.getAvatar().isBlank()) {
                currentUser.setAvatar(updateUser.getAvatar());
            }

            if (updateUser.getCoverPhoto() != null && !updateUser.getCoverPhoto().isBlank()) {
                currentUser.setCoverPhoto(updateUser.getCoverPhoto());
            }

            if (updateUser.getFirstName() != null && !updateUser.getFirstName().isBlank()) {
                currentUser.setFirstName(updateUser.getFirstName());
            }

            if (updateUser.getLastName() != null && !updateUser.getLastName().isBlank()) {
                currentUser.setLastName(updateUser.getLastName());
            }

            if (updateUser.getDateOfBirth() != null) {
                currentUser.setDateOfBirth(updateUser.getDateOfBirth());
            }

            if (updateUser.getGender() != null) {
                currentUser.setGender(updateUser.getGender());
            }

            if (updateUser.getWork() != null && !updateUser.getWork().isBlank()) {
                currentUser.setWork(updateUser.getWork());
            }

            if (updateUser.getEducation() != null && !updateUser.getEducation().isBlank()) {
                currentUser.setEducation(updateUser.getEducation());
            }

            if (updateUser.getCurrent_city() != null && !updateUser.getCurrent_city().isBlank()) {
                currentUser.setCurrent_city(updateUser.getCurrent_city());
            }

            if (updateUser.getHometown() != null && !updateUser.getHometown().isBlank()) {
                currentUser.setHometown(updateUser.getHometown());
            }

            if (updateUser.getBio() != null && !updateUser.getBio().isBlank()) {
                currentUser.setBio(updateUser.getBio());
            }

            if (updateUser.getRole() != null) {
                Role r = this.roleService.fetchById(updateUser.getRole().getId());
                currentUser.setRole(r != null ? r : null);
            }

            return this.userServiceRepository.save(currentUser);
        }
        return null;
    }

    @Override
    public ResUpdateUserDTO convertToResUpdateUserDTO(User user) {
        return ResUpdateUserDTO.builder()
                .email(user.getEmail())
                .fullname(user.getFirstName() + " " + user.getLastName())
                .avatar(user.getAvatar())
                .coverPhoto(user.getCoverPhoto())
                .dateOfBirth(user.getDateOfBirth())
                .gender(user.getGender())
                .work(user.getWork())
                .education(user.getEducation())
                .current_city(user.getCurrent_city())
                .hometown(user.getHometown())
                .bio(user.getBio())
                .build();
    }

    @Override
    public void handleDeleteUser(Long id) {
        this.userServiceRepository.deleteById(id);
    }

    @Override
    public void handleSaveImg(User user) {
        this.userServiceRepository.save(user);
    }

    @Override
    public ResultPaginationDTO fetchAllUsers(Specification<User> spec, Pageable pageable) {
        Page<User> pageUser = this.userServiceRepository.findAll(spec, pageable);
        ResultPaginationDTO rs = new ResultPaginationDTO();
        ResultPaginationDTO.Meta mt = new ResultPaginationDTO.Meta();

        mt.setPage(pageable.getPageNumber() + 1);
        mt.setPageSize(pageable.getPageSize());

        mt.setPages(pageUser.getTotalPages());
        mt.setTotal(pageUser.getTotalElements());

        rs.setMeta(mt);

        List<ResUserDTO> listUser = pageUser.getContent()
                .stream().map(item -> this.convertToResUserDTO(item))
                .collect(Collectors.toList());

        rs.setResult(listUser);

        return rs;
    }
}

package com.example.demo.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.domain.User;
import com.example.demo.domain.response.ResCreateUserDTO;
import com.example.demo.domain.response.ResUpdateUserDTO;
import com.example.demo.domain.response.ResUserDTO;
import com.example.demo.repository.UserServiceRepository;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE)
@AllArgsConstructor
public class UserServices {
    @Autowired
    UserServiceRepository userServiceRepository;

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

    public User handleGetUserByUsername(String username) {
        return this.userServiceRepository.findByEmail(username);
    }

    // Cập nhật token
    public void updateUserToken(String token, String email) {
        User currentUser = this.handleGetUserByUsername(email);
        if (currentUser != null) {
            currentUser.setRefreshToken(token);
            this.userServiceRepository.save(currentUser);
        }
    }

    public User getUserByRefreshTokenAndEmail(String token, String email) {
        return this.userServiceRepository.findByRefreshTokenAndEmail(token, email);
    }

    public boolean isEmailExist(String email) {
        return this.userServiceRepository.existsByEmail(email);
    }

    public User handleCreateUser(User user) {
        return this.userServiceRepository.save(user);
    }

    public ResCreateUserDTO convertToResCreateUserDTO(User user) {
        ResCreateUserDTO rs = new ResCreateUserDTO();
        rs.setId(user.getId());
        rs.setEmail(user.getEmail());
        rs.setGender(user.getGender());
        rs.setFullName(user.getLastName() + " " + user.getFirstName());
        rs.setCreatedAt(user.getCreatedAt());
        return rs;
    }

    // tìm 1 giá trị
    public User handleFindByIdUser(Long id) {
        Optional<User> UserOption = this.userServiceRepository.findById(id);
        if (UserOption.isPresent()) {
            return UserOption.get();
        }
        return null;
    }

    public ResUserDTO convertToResUserDTO(User user) {
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
                .isAdmin(user.getIs_admin())
                // .isBlocked(user.isBlocked())
                .build();
    }

    // sửa
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

            return this.userServiceRepository.save(currentUser);
        }
        return null;
    }

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

    public void handleDeleteUser(Long id) {
        this.userServiceRepository.deleteById(id);
    }

    public void handleSaveImg(User user) {
        this.userServiceRepository.save(user);
    }

}

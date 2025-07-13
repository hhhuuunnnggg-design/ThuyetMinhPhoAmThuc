package com.example.demo.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.domain.User;
import com.example.demo.domain.dto.ResultPaginationDTO;
import com.example.demo.domain.response.ResCreateUserDTO;
import com.example.demo.domain.response.ResUpdateUserDTO;
import com.example.demo.domain.response.ResUserDTO;
import com.example.demo.service.UserServices;
import com.example.demo.util.annotation.ApiMessage;
import com.example.demo.util.error.IdInvalidException;
import com.turkraft.springfilter.boot.Filter;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping(value = "/api/v1/users")
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserController {

    private UserServices userService;
    private PasswordEncoder passwordEncoder;

    @PostMapping("/add-user")
    @ApiMessage("Create a new user")
    public ResponseEntity<ResCreateUserDTO> createNewUser(@Valid @RequestBody User postManUser)
            throws IdInvalidException {
        boolean isEmailExist = this.userService.isEmailExist(postManUser.getEmail());
        if (isEmailExist) {
            throw new IdInvalidException(
                    "Email " + postManUser.getEmail() + "đã tồn tại, vui lòng sử dụng email khác.");
        }

        String hashPassword = this.passwordEncoder.encode(postManUser.getPassword());
        postManUser.setPassword(hashPassword);
        User ericUser = this.userService.handleCreateUser(postManUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(this.userService.convertToResCreateUserDTO(ericUser));
    }

    // tìm 1 giá trị
    @GetMapping("/{id}")
    @ApiMessage("fetch user by id")
    public ResponseEntity<ResUserDTO> getUserById(@PathVariable("id") Long id) throws IdInvalidException {
        User fetUser = this.userService.handleFindByIdUser(id);
        if (fetUser == null) {
            throw new IdInvalidException("User với id = " + id + " không tồn tại");
        }

        return ResponseEntity.ok(this.userService.convertToResUserDTO(fetUser));
    }

    @PutMapping("/{id}")
    @ApiMessage("Update a user")
    public ResponseEntity<ResUpdateUserDTO> updateUser(
            @PathVariable Long id,
            @RequestBody User user) throws IdInvalidException {
        // Đồng bộ id trong path và trong object
        user.setId(id);
        User updatedUser = userService.handleUpdateUser(user);
        if (updatedUser == null) {
            throw new IdInvalidException("User với id = " + id + " không tồn tại...");
        }
        return ResponseEntity.ok(userService.convertToResUpdateUserDTO(updatedUser));
    }

    // xóa
    @DeleteMapping("/{id}")
    @ApiMessage(value = "delete a user")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable long id) throws IdInvalidException {
        this.userService.handleDeleteUser(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Đã xóa thành công");
        return ResponseEntity.ok(response);
    }

    // Thêm endpoint để upload ảnh đại diện
    @PostMapping("/avatar")
    @ApiMessage(value = "upload image avatar")
    public ResponseEntity<Map<String, String>> updateAvatar(@RequestParam("userId") Long userId,
            @RequestParam("avatar") MultipartFile avatarFile)
            throws IOException {
        String originalFilename = avatarFile.getOriginalFilename();
        String cleanedFilename = originalFilename != null ? originalFilename.replaceAll("\\s+", "") : "unknown.jpg";
        String uniqueFileName = UUID.randomUUID().toString() + "_" + cleanedFilename;

        // Đường dẫn lưu file: uploads/avatars (ngang cấp với backend)
        String rootDir = System.getProperty("user.dir");
        Path avatarDir = Paths.get(rootDir, "uploads", "avatars");
        if (!Files.exists(avatarDir)) {
            Files.createDirectories(avatarDir);
        }
        Path targetPath = avatarDir.resolve(uniqueFileName);
        Files.copy(avatarFile.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        // Đường dẫn URL đầy đủ
        String avatarUrl = "http://localhost:8080/uploads/avatars/" + uniqueFileName;

        User user = userService.handleFindByIdUser(userId);
        if (user != null) {
            user.setAvatar(avatarUrl); // Lưu URL đầy đủ vào DB
            userService.handleSaveImg(user);
        }

        // Chuẩn bị response
        Map<String, String> data = new HashMap<>();
        data.put("avatar", avatarUrl);
        return ResponseEntity.ok(data);
    }

    // chức năng cho update coverPhoto
    // Thêm endpoint để upload ảnh đại diện
    @PostMapping("/coverPhoto")
    @ApiMessage(value = "upload coverPhoto")
    public ResponseEntity<Map<String, String>> uploadCoverPhoto(@RequestParam("userId") Long userId,
            @RequestParam("coverPhoto") MultipartFile avatarFile)
            throws IOException {
        String originalFilename = avatarFile.getOriginalFilename();
        String cleanedFilename = originalFilename != null ? originalFilename.replaceAll("\\s+", "") : "unknown.jpg";
        String uniqueFileName = UUID.randomUUID().toString() + "_" + cleanedFilename;

        // Đường dẫn lưu file: uploads/cover_photo (ngang cấp với backend)
        String rootDir = System.getProperty("user.dir");
        Path avatarDir = Paths.get(rootDir, "uploads", "cover_photo");
        if (!Files.exists(avatarDir)) {
            Files.createDirectories(avatarDir);
        }
        Path targetPath = avatarDir.resolve(uniqueFileName);
        Files.copy(avatarFile.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        // Đường dẫn URL đầy đủ
        String avatarUrl = "http://localhost:8080/uploads/cover_photo/" + uniqueFileName;

        User user = userService.handleFindByIdUser(userId);
        if (user != null) {
            user.setCoverPhoto(avatarUrl); // Lưu URL đầy đủ vào DB
            userService.handleSaveImg(user);
        }

        // Chuẩn bị response
        Map<String, String> data = new HashMap<>();
        data.put("coverPhoto", avatarUrl);

        return ResponseEntity.ok(data);
    }

    // fetch all users
    @GetMapping("/fetch-all")
    @ApiMessage("fetch all users")
    public ResponseEntity<ResultPaginationDTO> getAllUser(
            @Filter Specification<User> spec,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "100") int size) {

        // Convert one-based page to zero-based for Spring Boot
        Pageable pageable = PageRequest.of(page - 1, size);

        return ResponseEntity.status(HttpStatus.OK).body(
                this.userService.fetchAllUsers(spec, pageable));
    }

}

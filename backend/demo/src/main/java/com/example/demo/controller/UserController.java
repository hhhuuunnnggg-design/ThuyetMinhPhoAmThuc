package com.example.demo.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.User;
import com.example.demo.domain.response.ResUpdateUserDTO;
import com.example.demo.domain.response.ResUserDTO;
import com.example.demo.service.UserServices;
import com.example.demo.util.annotation.ApiMessage;
import com.example.demo.util.error.IdInvalidException;

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
            throw new IdInvalidException("User với id = " + id + " không tồn tại");
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

}

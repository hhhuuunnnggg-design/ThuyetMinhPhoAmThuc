package com.example.demo.domain;

import com.example.demo.domain.Enum.genderEnum;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.time.LocalDate;


@Entity
@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "email không được để trống")
    String email;


    String username;
    String password;

    String avatar;
    String coverPhoto;
    String firstName;
    String lastName;
    LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    genderEnum gender;

    @Column(columnDefinition = "MEDIUMTEXT")
    String refreshToken;

    String work; // Công việc hiện tại
    String education; // Học vấn
    String current_city; // nơi đang sống
    String hometown;
    String bio; // Mô tả ngắn gọn
    Boolean is_admin = false;
    Boolean is_blocked = false;
    Instant createdAt;

    // Phương thức tiện ích để kiểm tra trạng thái tài khoản
    @Transient
    public boolean isBlocked() {
        return is_blocked != null && is_blocked;
    }



}

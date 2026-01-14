package com.example.demo.domain.request.Role;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpsertRole {
    @NotBlank(message = "Tên không được để trống")
    String name;

    @NotBlank(message = "Mô tả không được để trống")
    String description;

    @NotBlank(message = "hoạt động được để trống")
    boolean active;

    Permission permissions;

    @Data
    @FieldDefaults(level = AccessLevel.PRIVATE)
    class Permission {
        @NotBlank(message = "Tên không được để trống")
        String name;

        @NotBlank(message = "apiPath không được để trống")
        String apiPath;

        @NotBlank(message = "method không được để trống")
        String method;

        @NotBlank(message = "module không được để trống")
        String module;

    }

}

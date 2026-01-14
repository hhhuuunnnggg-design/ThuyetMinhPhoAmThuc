package com.example.demo.domain.request.Permission;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpsertPermissionDTO {
    @NotBlank(message = "Tên không được để trống")
    String name;

    @NotBlank(message = "apiPath không được để trống")
    String apiPath;

    @NotBlank(message = "method không được để trống")
    String method;

    @NotBlank(message = "module không được để trống")
    String module;

}

package com.example.demo.domain.request;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import jakarta.validation.constraints.NotBlank;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReqLoginDTO {
    @NotBlank(message = "email không được để trống") // sử dụng được cái này là do đã có @valid
     String email;

    @NotBlank(message = "password không được để trống")
     String password;
}

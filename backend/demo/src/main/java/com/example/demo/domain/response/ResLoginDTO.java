package com.example.demo.domain.response;

import com.example.demo.domain.Role;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResLoginDTO {
    @JsonProperty("access_token")
    private String accessToken;

    UserLogin user;

    @Data
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserLogin {
        long id;
        String email;
        String fullname;
        Boolean is_admin;
        Role role;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserGetAccount {
        private UserLogin user;
    }

}

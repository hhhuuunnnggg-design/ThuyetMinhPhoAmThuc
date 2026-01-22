package com.example.demo.service;

import java.io.IOException;
import java.util.Map;

import com.example.demo.domain.User;

public interface AuthService {

    void updateUserToken(String token, String email);

    User handleGetUserByUsername(String username);

    User getUserByRefreshTokenAndEmail(String token, String email);

    String generateAuthUrl(String loginType);

    Map<String, Object> authenticateAndFetchProfile(String code, String loginType) throws IOException;

}

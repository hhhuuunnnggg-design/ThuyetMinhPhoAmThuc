package com.example.demo.controller;

import java.io.IOException;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.User;
import com.example.demo.domain.request.auth.ReqLoginDTO;
import com.example.demo.domain.request.auth.ReqRegisterDTO;
import com.example.demo.domain.response.ResCreateUserDTO;
import com.example.demo.domain.response.ResLoginDTO;
import com.example.demo.service.AuthService;
import com.example.demo.service.UserServices;
import com.example.demo.util.SecurityUtil;
import com.example.demo.util.annotation.ApiMessage;
import com.example.demo.util.error.IdInvalidException;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1")
public class AuthController {
    private final AuthenticationManagerBuilder authenticationManagerBuilder;
    private final SecurityUtil securityUtil;
    private final UserServices userService;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    @Value("${hoidanit.jwt.refresh-token-validity-in-seconds}")
    private long refreshTokenExpiration;

    @Value("${hoidanit.jwt.access-token-validity-in-seconds}")
    private long accessTokenExpiration;

    @Value("${stringee.api.key.sid:}")
    private String keySid;

    @Value("${stringee.api.key.secret:}")
    private String keySecret;

    @Value("${app.cookie.secure:true}")
    private boolean cookieSecure;

    @Value("${app.cookie.same-site:Lax}")
    private String cookieSameSite;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    public AuthController(
            AuthenticationManagerBuilder authenticationManagerBuilder,
            SecurityUtil securityUtil,
            UserServices userService,
            PasswordEncoder passwordEncoder,
            AuthService authService) {
        this.authenticationManagerBuilder = authenticationManagerBuilder;
        this.securityUtil = securityUtil;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
    }

    @PostMapping("/auth/login")
    public ResponseEntity<ResLoginDTO> login(@Valid @RequestBody ReqLoginDTO loginDto) throws IdInvalidException {
        // Authenticate user
        Authentication authentication = authenticateUser(loginDto.getEmail(), loginDto.getPassword());
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Get and validate user
        User user = userService.handleGetUserByUsername(loginDto.getEmail());
        validateUserNotBlocked(user);

        // Build response with tokens
        ResLoginDTO response = buildLoginResponse(user, loginDto.getEmail());
        String refreshToken = securityUtil.createRefreshToken(loginDto.getEmail(), response);
        userService.updateUserToken(refreshToken, loginDto.getEmail());

        // Return response with cookie
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, createRefreshTokenCookie(refreshToken).toString())
                .body(response);
    }

    @GetMapping("/auth/account")
    @ApiMessage("fetch account")
    public ResponseEntity<ResLoginDTO.UserGetAccount> getAccount() throws IdInvalidException {
        String email = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new IdInvalidException("Người dùng chưa đăng nhập"));

        User user = userService.handleGetUserByUsername(email);
        ResLoginDTO.UserGetAccount response = new ResLoginDTO.UserGetAccount();

        if (user != null) {
            response.setUser(convertUserToUserLogin(user));
        }

        return ResponseEntity.ok().body(response);
    }

    @GetMapping("/auth/refresh")
    @ApiMessage("Get User by refresh token")
    public ResponseEntity<ResLoginDTO> getRefreshToken(
            @CookieValue(name = "refresh_token", defaultValue = "") String refreshToken) throws IdInvalidException {

        if (refreshToken.isEmpty()) {
            throw new IdInvalidException("Bạn không có refresh token ở cookie");
        }

        // Validate refresh token
        Jwt decodedToken = securityUtil.checkValidRefreshToken(refreshToken);
        String email = decodedToken.getSubject();

        // Verify user exists and token matches
        User user = userService.getUserByRefreshTokenAndEmail(refreshToken, email);
        if (user == null) {
            throw new IdInvalidException("Refresh Token không hợp lệ");
        }

        // Build response and generate new tokens
        ResLoginDTO response = buildLoginResponse(user, email);
        String newRefreshToken = securityUtil.createRefreshToken(email, response);
        userService.updateUserToken(newRefreshToken, email);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, createRefreshTokenCookie(newRefreshToken).toString())
                .body(response);
    }

    @PostMapping("/auth/logout")
    @ApiMessage("Logout User")
    public ResponseEntity<Void> logout() throws IdInvalidException {
        String email = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new IdInvalidException("Access Token không hợp lệ"));

        // Clear refresh token
        userService.updateUserToken(null, email);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, createDeleteCookie().toString())
                .build();
    }

    @PostMapping("/auth/register")
    @ApiMessage("Register a new user")
    public ResponseEntity<ResCreateUserDTO> register(@Valid @RequestBody ReqRegisterDTO reqRegisterDTO)
            throws IdInvalidException {
        boolean isEmailExist = this.userService.isEmailExist(reqRegisterDTO.getEmail());
        if (isEmailExist) {
            throw new IdInvalidException(
                    "Email " + reqRegisterDTO.getEmail() + " đã tồn tại, vui lòng sử dụng email khác.");
        }

        // Map từ DTO sang Entity
        User newUser = new User();
        newUser.setEmail(reqRegisterDTO.getEmail());
        newUser.setPassword(this.passwordEncoder.encode(reqRegisterDTO.getPassword()));
        newUser.setFirstName(reqRegisterDTO.getFirstName());
        newUser.setLastName(reqRegisterDTO.getLastName());

        User createdUser = this.userService.handleCreateUser(newUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(this.userService.convertToResCreateUserDTO(createdUser));
    }

    @GetMapping("/auth/social/login")
    @ApiMessage("Redirect to OAuth provider (Google/Facebook)")
    public ResponseEntity<String> socialLogin(@RequestParam("login_type") String loginType) throws IdInvalidException {
        String normalizedLoginType = validateAndNormalizeLoginType(loginType);
        String authUrl = authService.generateAuthUrl(normalizedLoginType);

        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, authUrl)
                .build();
    }

    @GetMapping("/auth/social/callback")
    @ApiMessage("OAuth callback handler for Google/Facebook")
    public ResponseEntity<ResLoginDTO> socialCallback(
            @RequestParam(value = "login_type", required = false) String loginType,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "error", required = false) String error) throws IdInvalidException, IOException {

        // Validate OAuth callback parameters
        validateOAuthCallback(error, code, loginType, state);
        String normalizedLoginType = validateAndNormalizeLoginType(loginType != null ? loginType : state);

        // Fetch user info from OAuth provider
        Map<String, Object> userInfo = authService.authenticateAndFetchProfile(code, normalizedLoginType);
        if (userInfo == null) {
            throw new IdInvalidException("Không thể lấy thông tin từ " + normalizedLoginType);
        }

        // Extract and validate user information
        OAuthUserInfo oauthUserInfo = extractOAuthUserInfo(userInfo, normalizedLoginType);
        if (oauthUserInfo.email() == null || oauthUserInfo.email().isEmpty()) {
            throw new IdInvalidException("Không thể lấy email từ " + normalizedLoginType);
        }

        // Create or update user
        User user = createOrUpdateOAuthUser(oauthUserInfo);

        // Build response and generate tokens
        ResLoginDTO response = buildLoginResponse(user, oauthUserInfo.email());
        String refreshToken = securityUtil.createRefreshToken(oauthUserInfo.email(), response);
        userService.updateUserToken(refreshToken, oauthUserInfo.email());

        // Redirect to frontend with token
        String redirectUrl = frontendUrl + "/login?token=" + response.getAccessToken() + "&success=true";

        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, redirectUrl)
                .header(HttpHeaders.SET_COOKIE, createRefreshTokenCookie(refreshToken).toString())
                .build();
    }

    // ==================== Helper Methods ====================

    /**
     * Authenticate user with email and password
     */
    private Authentication authenticateUser(String email, String password) {
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(email, password);
        return authenticationManagerBuilder.getObject().authenticate(authToken);
    }

    /**
     * Validate that user is not blocked
     */
    private void validateUserNotBlocked(User user) throws IdInvalidException {
        if (user != null && Boolean.TRUE.equals(user.getIs_blocked())) {
            throw new IdInvalidException("Tài khoản của bạn đã bị khóa");
        }
    }

    /**
     * Build login response with user info and access token
     */
    private ResLoginDTO buildLoginResponse(User user, String email) {
        ResLoginDTO response = new ResLoginDTO();
        response.setUser(convertUserToUserLogin(user));

        String accessToken = securityUtil.createAccessToken(email, response);
        response.setAccessToken(accessToken);

        return response;
    }

    /**
     * Convert User entity to UserLogin DTO
     */
    private ResLoginDTO.UserLogin convertUserToUserLogin(User user) {
        String fullName = buildFullName(user.getLastName(), user.getFirstName());

        return new ResLoginDTO.UserLogin(
                user.getId(),
                user.getEmail(),
                fullName,
                user.getIs_admin(),
                user.getAvatar(),
                user.getCoverPhoto(),
                user.getIs_blocked(),
                user.getRole());
    }

    /**
     * Build full name from last name and first name
     */
    private String buildFullName(String lastName, String firstName) {
        String last = lastName != null ? lastName : "";
        String first = firstName != null ? firstName : "";
        return (last + " " + first).trim();
    }

    /**
     * Create refresh token cookie
     */
    private ResponseCookie createRefreshTokenCookie(String refreshToken) {
        return ResponseCookie
                .from("refresh_token", refreshToken)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(refreshTokenExpiration)
                .build();
    }

    /**
     * Create delete cookie (for logout)
     */
    private ResponseCookie createDeleteCookie() {
        return ResponseCookie
                .from("refresh_token", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(0)
                .build();
    }

    /**
     * Validate and normalize login type
     */
    private String validateAndNormalizeLoginType(String loginType) throws IdInvalidException {
        if (loginType == null || loginType.trim().isEmpty()) {
            throw new IdInvalidException("Login type không được cung cấp");
        }

        String normalized = loginType.trim().toLowerCase();
        if (!"google".equals(normalized) && !"facebook".equals(normalized)) {
            throw new IdInvalidException("Login type không hợp lệ. Chỉ hỗ trợ: google, facebook");
        }

        return normalized;
    }

    /**
     * Validate OAuth callback parameters
     */
    private void validateOAuthCallback(String error, String code, String loginType, String state)
            throws IdInvalidException {
        if (error != null) {
            throw new IdInvalidException("Đăng nhập thất bại: " + error);
        }

        if (code == null || code.isEmpty()) {
            throw new IdInvalidException("Authorization code không được cung cấp");
        }

        if (loginType == null && state == null) {
            throw new IdInvalidException("Login type không được cung cấp");
        }
    }

    /**
     * Record to hold OAuth user information
     */
    private record OAuthUserInfo(String email, String firstName, String lastName, String avatar) {
    }

    /**
     * Extract OAuth user information from provider response
     */
    private OAuthUserInfo extractOAuthUserInfo(Map<String, Object> userInfo, String loginType) {
        return new OAuthUserInfo(
                extractEmail(userInfo, loginType),
                extractFirstName(userInfo, loginType),
                extractLastName(userInfo, loginType),
                extractAvatar(userInfo, loginType));
    }

    /**
     * Create or update user from OAuth information
     */
    private User createOrUpdateOAuthUser(OAuthUserInfo oauthInfo) throws IdInvalidException {
        User existingUser = userService.handleGetUserByUsername(oauthInfo.email());

        if (existingUser == null) {
            // Create new user
            User newUser = new User();
            newUser.setEmail(oauthInfo.email());
            newUser.setPassword(null); // OAuth users don't need password
            newUser.setFirstName(oauthInfo.firstName() != null ? oauthInfo.firstName() : "");
            newUser.setLastName(oauthInfo.lastName() != null ? oauthInfo.lastName() : "");
            newUser.setAvatar(oauthInfo.avatar());
            newUser.setIs_admin(false);
            newUser.setIs_blocked(false);
            return userService.handleCreateUser(newUser);
        } else {
            // Update existing user
            validateUserNotBlocked(existingUser);
            updateUserFromOAuthInfo(existingUser, oauthInfo);
            return userService.handleCreateUser(existingUser);
        }
    }

    /**
     * Update user information from OAuth provider
     */
    private void updateUserFromOAuthInfo(User user, OAuthUserInfo oauthInfo) {
        if (oauthInfo.avatar() != null && !oauthInfo.avatar().isEmpty()) {
            user.setAvatar(oauthInfo.avatar());
        }
        if (oauthInfo.firstName() != null && !oauthInfo.firstName().isEmpty()) {
            user.setFirstName(oauthInfo.firstName());
        }
        if (oauthInfo.lastName() != null && !oauthInfo.lastName().isEmpty()) {
            user.setLastName(oauthInfo.lastName());
        }
    }

    // ==================== OAuth Data Extraction Methods ====================

    /**
     * Extract email from OAuth provider response
     */
    private String extractEmail(Map<String, Object> userInfo, String loginType) {
        if ("google".equals(loginType)) {
            return (String) userInfo.get("email");
        } else if ("facebook".equals(loginType)) {
            return (String) userInfo.get("email");
        }
        return null;
    }

    /**
     * Extract first name from OAuth provider response
     */
    private String extractFirstName(Map<String, Object> userInfo, String loginType) {
        if ("google".equals(loginType)) {
            String name = (String) userInfo.get("given_name");
            if (name == null) {
                // Fallback: split từ "name" field
                String fullName = (String) userInfo.get("name");
                if (fullName != null && fullName.contains(" ")) {
                    return fullName.split(" ")[0];
                }
            }
            return name;
        } else if ("facebook".equals(loginType)) {
            String name = (String) userInfo.get("name");
            if (name != null && name.contains(" ")) {
                return name.split(" ")[0];
            }
            return name;
        }
        return null;
    }

    /**
     * Extract last name from OAuth provider response
     */
    private String extractLastName(Map<String, Object> userInfo, String loginType) {
        if ("google".equals(loginType)) {
            String name = (String) userInfo.get("family_name");
            if (name == null) {
                // Fallback: split từ "name" field
                String fullName = (String) userInfo.get("name");
                if (fullName != null && fullName.contains(" ")) {
                    String[] parts = fullName.split(" ");
                    if (parts.length > 1) {
                        return parts[parts.length - 1];
                    }
                }
            }
            return name;
        } else if ("facebook".equals(loginType)) {
            String name = (String) userInfo.get("name");
            if (name != null && name.contains(" ")) {
                String[] parts = name.split(" ");
                if (parts.length > 1) {
                    return parts[parts.length - 1];
                }
            }
            return null;
        }
        return null;
    }

    /**
     * Extract avatar URL from OAuth provider response
     */
    private String extractAvatar(Map<String, Object> userInfo, String loginType) {
        if ("google".equals(loginType)) {
            return (String) userInfo.get("picture");
        } else if ("facebook".equals(loginType)) {
            @SuppressWarnings("unchecked")
            Map<String, Object> picture = (Map<String, Object>) userInfo.get("picture");
            if (picture != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) picture.get("data");
                if (data != null) {
                    return (String) data.get("url");
                }
            }
        }
        return null;
    }

}

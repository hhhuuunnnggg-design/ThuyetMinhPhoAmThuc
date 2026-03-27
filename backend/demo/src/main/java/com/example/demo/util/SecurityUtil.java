package com.example.demo.util;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;

import com.example.demo.domain.response.ResLoginDTO;
import com.nimbusds.jose.util.Base64;

@Service
public class SecurityUtil {
    private final JwtEncoder jwtEncoder;

    public SecurityUtil(JwtEncoder jwtEncoder) {
        this.jwtEncoder = jwtEncoder;
    }

    public static final MacAlgorithm JWT_ALGORITHM = MacAlgorithm.HS512;

    @Value("${hoidanit.jwt.base64-secret}")
    private String jwtKey;

    @Value("${hoidanit.jwt.access-token-validity-in-seconds}")
    private long accessTokenExpiration;

    @Value("${hoidanit.jwt.refresh-token-validity-in-seconds}")
    private long refreshTokenExpiration;

    public String createAccessToken(String email, ResLoginDTO dto) {
        // Dữ liệu người dùng này sẽ được nhúng vào trong token →
        // giúp backend đọc ra thông tin user mà không cần truy DB mỗi lần.
        // thiết lập thời gian sống cho token
        Instant now = Instant.now();
        Instant validity = now.plus(this.accessTokenExpiration, ChronoUnit.SECONDS);

        // @formatter:off
//        dữ liệu chính trong token - chỉ đưa primitive values để tránh reflection issues
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuedAt(now)
                .expiresAt(validity)
                .subject(email)
                .claim("user_id", dto.getUser().getId())
                .claim("user_email", dto.getUser().getEmail())
                .claim("user_fullname", dto.getUser().getFullname())
                .claim("user_is_admin", dto.getUser().getIs_admin())
                .claim("user_role_id", dto.getUser().getRole() != null ? dto.getUser().getRole().getId() : "")
                .claim("user_role_name", dto.getUser().getRole() != null ? dto.getUser().getRole().getName() : "")
                .build();

//        Mã hóa JWT bằng thuật toán HS512 và trả về chuỗi token dạng eyJhbGciOi...
        JwsHeader jwsHeader = JwsHeader.with(JWT_ALGORITHM).build();
        return this.jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader, claims)).getTokenValue();

    }

    public String createRefreshToken(String email, ResLoginDTO dto) {
        Instant now = Instant.now();
        Instant validity = now.plus(this.refreshTokenExpiration, ChronoUnit.SECONDS);

        // @formatter:off
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuedAt(now)
                .expiresAt(validity)
                .subject(email)
                .claim("user_id", dto.getUser().getId())
                .claim("user_email", dto.getUser().getEmail())
                .claim("user_fullname", dto.getUser().getFullname())
                .claim("user_is_admin", dto.getUser().getIs_admin())
                .claim("user_role_id", dto.getUser().getRole() != null ? dto.getUser().getRole().getId() : "")
                .claim("user_role_name", dto.getUser().getRole() != null ? dto.getUser().getRole().getName() : "")
                .build();

        JwsHeader jwsHeader = JwsHeader.with(JWT_ALGORITHM).build();
        return this.jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader, claims)).getTokenValue();

    }

    // mã hóa token
    private SecretKey getSecretKey() {
        // giải mã key
        byte[] keyBytes = Base64.from(jwtKey).decode();
        return new SecretKeySpec(keyBytes, 0, keyBytes.length,
                JWT_ALGORITHM.getName());
    }

    public Jwt checkValidRefreshToken(String token){
        NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withSecretKey(
                getSecretKey()).macAlgorithm(SecurityUtil.JWT_ALGORITHM).build();
        try {
            return jwtDecoder.decode(token);
        } catch (Exception e) {
            System.out.println(">>> Refresh Token error: " + e.getMessage());
            throw e;
        }
    }

    public static Optional<String> getCurrentUserLogin() {
        SecurityContext securityContext = SecurityContextHolder.getContext();
        return Optional.ofNullable(extractPrincipal(securityContext.getAuthentication()));
    }
    
    private static String extractPrincipal(Authentication authentication) {
        
        if (authentication == null) {
            return null;
        } else if (authentication.getPrincipal() instanceof UserDetails springSecurityUser) {
            return springSecurityUser.getUsername();
        } else if (authentication.getPrincipal() instanceof Jwt jwt) {
            return jwt.getSubject();
        } else if (authentication.getPrincipal() instanceof String s) {
            return s;
        }
        return null;
    }

    public static Optional<String> getCurrentUserJWT() {
        SecurityContext securityContext = SecurityContextHolder.getContext();
        return Optional.ofNullable(securityContext.getAuthentication())
                .filter(authentication -> authentication.getCredentials() instanceof String)
                .map(authentication -> (String) authentication.getCredentials());
    }

    /**
     * Lấy user id từ JWT (claim {@code user_id}) — dùng khi admin tạo bản ghi gắn chủ sở hữu.
     */
    public static Optional<Long> getCurrentUserId() {
        SecurityContext securityContext = SecurityContextHolder.getContext();
        Authentication authentication = securityContext.getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            return Optional.empty();
        }
        Object claim = jwt.getClaim("user_id");
        if (claim == null) {
            return Optional.empty();
        }
        if (claim instanceof Number n) {
            return Optional.of(n.longValue());
        }
        if (claim instanceof String s && !s.isBlank()) {
            try {
                return Optional.of(Long.parseLong(s));
            } catch (NumberFormatException ignored) {
                return Optional.empty();
            }
        }
        return Optional.empty();
    }

    /**
     * JWT hiện tại (Resource Server) — dùng đọc claim vai trò / quyền.
     */
    public static Optional<Jwt> getCurrentJwt() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            return Optional.of(jwt);
        }
        return Optional.empty();
    }

    /**
     * Xem toàn bộ dữ liệu admin (ví dụ mọi POI): {@code is_admin} hoặc vai trò {@code SUPER_ADMIN}.
     * SHOP_OWNER và các role khác (khi đã đăng nhập) chỉ thấy dữ liệu của chính họ ở từng service.
     */
    public static boolean isFullAdminJwt(Jwt jwt) {
        if (jwt == null) {
            return false;
        }
        Object adminClaim = jwt.getClaim("user_is_admin");
        if (adminClaim instanceof Boolean b && b) {
            return true;
        }
        if (adminClaim instanceof String s && "true".equalsIgnoreCase(s)) {
            return true;
        }
        Object role = jwt.getClaim("user_role_name");
        return role != null && "SUPER_ADMIN".equalsIgnoreCase(String.valueOf(role));
    }

    /**
     * Email đăng nhập từ JWT ({@code user_email} hoặc subject), chuẩn hóa để so khớp {@code owner_email} nhà hàng.
     */
    public static Optional<String> getCurrentUserEmailNormalized() {
        Optional<Jwt> jwtOpt = getCurrentJwt();
        if (jwtOpt.isEmpty()) {
            return Optional.empty();
        }
        Jwt jwt = jwtOpt.get();
        Object claim = jwt.getClaim("user_email");
        String raw = claim != null ? String.valueOf(claim).trim() : "";
        if (raw.isBlank() && jwt.getSubject() != null) {
            raw = jwt.getSubject().trim();
        }
        if (raw.isBlank()) {
            return Optional.empty();
        }
        return Optional.of(raw.toLowerCase());
    }

    /**
     * Dashboard / Top POI theo chủ quán: JWT có nhưng không phải full admin → chỉ dữ liệu POI do
     * {@code user_id} trong token tạo (SHOP_OWNER). Full admin hoặc không có JWT → {@code null} (không lọc).
     */
    public static Long getPoiOwnerScopeUserIdOrNull() {
        return getCurrentJwt()
                .filter(jwt -> !isFullAdminJwt(jwt))
                .flatMap(j -> getCurrentUserId())
                .orElse(null);
    }
}

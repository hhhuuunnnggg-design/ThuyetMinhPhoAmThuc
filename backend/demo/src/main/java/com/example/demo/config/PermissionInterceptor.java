// package com.example.demo.config;

// import java.util.List;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.transaction.annotation.Transactional;
// import org.springframework.util.AntPathMatcher;
// import org.springframework.web.servlet.HandlerInterceptor;
// import org.springframework.web.servlet.HandlerMapping;

// import com.example.demo.domain.Permission;
// import com.example.demo.domain.Role;
// import com.example.demo.domain.User;
// import com.example.demo.service.UserServices;
// import com.example.demo.util.SecurityUtil;
// import com.example.demo.util.error.PermissionException;

// import jakarta.servlet.http.HttpServletRequest;
// import jakarta.servlet.http.HttpServletResponse;

// public class PermissionInterceptor implements HandlerInterceptor {

// @Autowired
// private UserServices userService;

// private final AntPathMatcher pathMatcher = new AntPathMatcher();

// @Override
// @Transactional
// public boolean preHandle(
// HttpServletRequest request,
// HttpServletResponse response,
// Object handler) throws Exception {

// String pathPattern = (String) request.getAttribute(
// HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
// String requestURI = request.getRequestURI();
// String httpMethod = request.getMethod();

// System.out.println(">>> RUN preHandle");
// System.out.println(">>> pathPattern = " + pathPattern);
// System.out.println(">>> httpMethod = " + httpMethod);
// System.out.println(">>> requestURI = " + requestURI);

// // ==================== CHECK PERMISSION ====================

// String email = SecurityUtil.getCurrentUserLogin().orElse("");

// if (email == null || email.isEmpty()) {
// return true; // chưa login thì cho đi tiếp (tuỳ policy)
// }

// User user = userService.handleGetUserByUsername(email);
// if (user == null) {
// throw new PermissionException("Không tìm thấy người dùng.");
// }

// // Role role = user.getUserRole().getRole();
// Role role = user.getRole();
// if (role == null) {
// throw new PermissionException("Người dùng chưa được gán role.");
// }

// List<Permission> permissions = role.getPermissions();

// // So sánh path pattern với permission, hỗ trợ pattern matching
// boolean isAllow = permissions.stream()
// .anyMatch(permission -> {
// String permissionPath = permission.getApiPath();
// String permissionMethod = permission.getMethod();

// // So sánh method trước
// if (!permissionMethod.equalsIgnoreCase(httpMethod)) {
// return false;
// }

// // Nếu path pattern từ HandlerMapping có sẵn, so sánh trực tiếp
// if (pathPattern != null) {
// return permissionPath.equals(pathPattern);
// }

// // Nếu path pattern null, match requestURI với permission pattern
// // Convert {id} -> * để dùng với AntPathMatcher
// String antPattern = permissionPath.replaceAll("\\{[^}]+\\}", "*");
// return pathMatcher.match(antPattern, requestURI);
// });

// if (!isAllow) {
// throw new PermissionException(
// "Bạn không có quyền truy cập endpoint này. "
// + "PathPattern: " + pathPattern
// + ", URI: " + requestURI
// + ", Method: " + httpMethod);
// }

// return true;
// }
// }
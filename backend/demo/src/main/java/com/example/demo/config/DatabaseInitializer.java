package com.example.demo.config;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.demo.domain.Permission;
import com.example.demo.domain.Role;
import com.example.demo.domain.User;
import com.example.demo.domain.Enum.genderEnum;
import com.example.demo.repository.PermissionRepository;
import com.example.demo.repository.RoleRepository;
import com.example.demo.repository.UserServiceRepository;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class DatabaseInitializer implements CommandLineRunner {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final UserServiceRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseInitializer(
            PermissionRepository permissionRepository,
            RoleRepository roleRepository,
            UserServiceRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.permissionRepository = permissionRepository;
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private Permission createPermission(String name, String apiPath, String method, String module) {
        Permission permission = new Permission();
        permission.setName(name);
        permission.setApiPath(apiPath);
        permission.setMethod(method);
        permission.setModule(module);
        return permission;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println(">>> START INIT DATABASE");

        // ========== PERMISSIONS ==========
        if (this.permissionRepository.count() == 0) {
            ArrayList<Permission> arr = new ArrayList<>();

            // Users permissions
            arr.add(createPermission("Xem tất cả danh sách người dùng", "/api/v1/users/fetch-all", "GET", "USERS"));
            arr.add(createPermission("Xóa người dùng", "/api/v1/users/{id}", "DELETE", "USERS"));
            arr.add(createPermission("thay đổi trạng thái người dùng", "/api/v1/users/changeActivity/{id}", "PUT", "USERS"));
            arr.add(createPermission("Upload avatar", "/api/v1/users/avatar", "POST", "USERS"));
            arr.add(createPermission("Upload cover photo", "/api/v1/users/coverPhoto", "POST", "USERS"));
            arr.add(createPermission("Admin tạo người dùng", "/api/v1/users/admin/create", "POST", "USERS"));
            arr.add(createPermission("Admin cập nhật người dùng", "/api/v1/users/admin/{id}", "PUT", "USERS"));
            arr.add(createPermission("Thêm người dùng", "/api/v1/users/add-user", "POST", "USERS"));
            arr.add(createPermission("Cập nhật người dùng", "/api/v1/users/{id}", "PUT", "USERS"));

            // Permissions
            arr.add(createPermission("Tạo quyền mới", "/api/v1/permissions/create", "POST", "PERMISSIONS"));
            arr.add(createPermission("Cập nhật quyền", "/api/v1/permissions/{id}", "PUT", "PERMISSIONS"));
            arr.add(createPermission("Xóa quyền", "/api/v1/permissions/{id}", "DELETE", "PERMISSIONS"));
            arr.add(createPermission("Xem danh sách quyền", "/api/v1/permissions/fetch-all", "GET", "PERMISSIONS"));

            // Roles
            arr.add(createPermission("Tạo vai trò mới", "/api/v1/roles/create", "POST", "ROLES"));
            arr.add(createPermission("Cập nhật vai trò", "/api/v1/roles/{id}", "PUT", "ROLES"));
            arr.add(createPermission("Xóa vai trò", "/api/v1/roles/{id}", "DELETE", "ROLES"));
            arr.add(createPermission("Xem danh sách vai trò", "/api/v1/roles/fetch-all", "GET", "ROLES"));

            // TTS permissions
            arr.add(createPermission("Chuyển đổi text thành speech", "/api/v1/tts/synthesize", "POST", "TTS"));
            arr.add(createPermission("Xem danh sách giọng đọc", "/api/v1/tts/voices", "GET", "TTS"));
            arr.add(createPermission("Tạo và lưu audio lên S3", "/api/v1/tts/synthesize-and-save", "POST", "TTS"));
            arr.add(createPermission("Xem danh sách TTS audios", "/api/v1/tts/audios", "GET", "TTS"));
            arr.add(createPermission("Xem danh sách TTS audios của mình", "/api/v1/tts/audios/my", "GET", "TTS"));
            arr.add(createPermission("Xem TTS audio theo ID", "/api/v1/tts/audios/{id}", "GET", "TTS"));
            arr.add(createPermission("Cập nhật TTS audio", "/api/v1/tts/audios/{id}", "PUT", "TTS"));
            arr.add(createPermission("Xóa TTS audio", "/api/v1/tts/audios/{id}", "DELETE", "TTS"));
            arr.add(createPermission("Tải xuống TTS audio", "/api/v1/tts/audios/{id}/download", "GET", "TTS"));
            arr.add(createPermission("Upload ảnh món ăn lên TTS audio", "/api/v1/tts/audios/{id}/image", "POST", "TTS"));
            arr.add(createPermission("Upload ảnh món ăn (không cần audio ID)", "/api/v1/tts/images/upload", "POST", "TTS"));
            arr.add(createPermission("Tạo audio đa ngôn ngữ (batch)", "/api/v1/tts/multilingual", "POST", "TTS"));
            arr.add(createPermission("Tạo đa ngôn ngữ cho audio đã tồn tại", "/api/v1/tts/audios/{id}/generate-multilingual", "POST", "TTS"));

            // TTS Groups permissions
            arr.add(createPermission("Xem danh sách tất cả groups", "/api/v1/tts/groups", "GET", "TTS_GROUPS"));
            arr.add(createPermission("Xem group theo ID", "/api/v1/tts/groups/{id}", "GET", "TTS_GROUPS"));
            arr.add(createPermission("Xem group theo groupKey", "/api/v1/tts/groups/key/{groupKey}", "GET", "TTS_GROUPS"));
            arr.add(createPermission("Xóa group và tất cả audio trong group", "/api/v1/tts/groups/{id}", "DELETE", "TTS_GROUPS"));
            arr.add(createPermission("Cập nhật metadata group TTS", "/api/v1/tts/groups/{id}", "PUT", "TTS_GROUPS"));
            arr.add(createPermission("Tạo audio đa ngôn ngữ cho group", "/api/v1/tts/groups/{id}/generate-multilingual", "POST", "TTS_GROUPS"));

            // App client permissions (POI + narration)
            arr.add(createPermission("App client - lấy danh sách POI", "/api/v1/app/pois", "GET", "APP_CLIENT"));
            arr.add(createPermission("App client - kiểm tra phát narration", "/api/v1/app/narration/check", "POST", "APP_CLIENT"));
            arr.add(createPermission("App client - ghi log narration", "/api/v1/app/narration/log", "POST", "APP_CLIENT"));

            // Narration logs permissions (admin)
            arr.add(createPermission("Xem danh sách narration logs", "/api/v1/admin/narration-logs", "GET", "NARRATION_LOGS"));

            // POI Admin — SHOP_OWNER có quyền API nhưng backend lọc theo JWT:
            // SUPER_ADMIN / is_admin xem & sửa mọi POI; SHOP_OWNER chỉ POI do user_id của họ tạo (POIServiceImpl).
            arr.add(createPermission("Xem danh sách POI (admin)", "/api/v1/admin/pois", "GET", "POI_ADMIN"));
            arr.add(createPermission("Xem chi tiết POI (admin)", "/api/v1/admin/pois/{id}", "GET", "POI_ADMIN"));
            arr.add(createPermission("Tạo POI (admin)", "/api/v1/admin/pois", "POST", "POI_ADMIN"));
            arr.add(createPermission("Cập nhật POI (admin)", "/api/v1/admin/pois/{id}", "PUT", "POI_ADMIN"));
            arr.add(createPermission("Xóa POI (admin)", "/api/v1/admin/pois/{id}", "DELETE", "POI_ADMIN"));

            // Restaurant Admin permissions
            arr.add(createPermission("Xem danh sách nhà hàng (admin)", "/api/v1/admin/restaurants", "GET", "RESTAURANT_ADMIN"));
            arr.add(createPermission("Xem chi tiết nhà hàng (admin)", "/api/v1/admin/restaurants/{id}", "GET", "RESTAURANT_ADMIN"));
            arr.add(createPermission("Tạo nhà hàng (admin)", "/api/v1/admin/restaurants", "POST", "RESTAURANT_ADMIN"));
            arr.add(createPermission("Cập nhật nhà hàng (admin)", "/api/v1/admin/restaurants/{id}", "PUT", "RESTAURANT_ADMIN"));
            arr.add(createPermission("Xóa nhà hàng (admin)", "/api/v1/admin/restaurants/{id}", "DELETE", "RESTAURANT_ADMIN"));

            this.permissionRepository.saveAll(arr);
        }

        // ========== ROLES ==========
        List<Permission> allPermissions = this.permissionRepository.findAll();

        Role superAdminRole = this.roleRepository.findByName("SUPER_ADMIN").orElse(null);
        if (superAdminRole == null) {
            superAdminRole = new Role();
            superAdminRole.setName("SUPER_ADMIN");
            superAdminRole.setDescription("Quản trị viên — toàn quyền hệ thống");
            superAdminRole.setActive(true);
            superAdminRole.setPermissions(allPermissions);
            superAdminRole = this.roleRepository.save(superAdminRole);
        }

        // SHOP_OWNER — cùng endpoint admin POI/nhà hàng/TTS/narration logs nhưng backend lọc theo user trong JWT
        Role shopOwnerRole = this.roleRepository.findByName("SHOP_OWNER").orElse(null);
        if (shopOwnerRole == null) {
            List<Permission> shopPermissions = allPermissions.stream()
                    .filter(p -> {
                        String mod = p.getModule();
                        return "TTS".equals(mod) || "TTS_GROUPS".equals(mod)
                                || "POI_ADMIN".equals(mod) || "RESTAURANT_ADMIN".equals(mod)
                                || "APP_CLIENT".equals(mod)
                                || "NARRATION_LOGS".equals(mod);
                    })
                    .toList();

            shopOwnerRole = new Role();
            shopOwnerRole.setName("SHOP_OWNER");
            shopOwnerRole.setDescription(
                    "Chủ quán — POI/TTS/nhà hàng/narration logs: API giống admin nhưng chỉ thấy dữ liệu gắn POI do chính user đó tạo (user_id trên JWT)");
            shopOwnerRole.setActive(true);
            shopOwnerRole.setPermissions(shopPermissions);
            this.roleRepository.save(shopOwnerRole);
        } else {
            Optional<Permission> narrationLogPerm = allPermissions.stream()
                    .filter(p -> "NARRATION_LOGS".equals(p.getModule())
                            && "/api/v1/admin/narration-logs".equals(p.getApiPath())
                            && "GET".equalsIgnoreCase(p.getMethod()))
                    .findFirst();
            if (narrationLogPerm.isPresent()) {
                Permission np = narrationLogPerm.get();
                List<Permission> currentPerms = shopOwnerRole.getPermissions();
                if (currentPerms == null) {
                    currentPerms = new ArrayList<>();
                }
                boolean already = currentPerms.stream()
                        .anyMatch(x -> x != null && "/api/v1/admin/narration-logs".equals(x.getApiPath())
                                && "GET".equalsIgnoreCase(x.getMethod()));
                if (!already) {
                    ArrayList<Permission> merged = new ArrayList<>(currentPerms);
                    merged.add(np);
                    shopOwnerRole.setPermissions(merged);
                    this.roleRepository.save(shopOwnerRole);
                }
            }
        }

        // ========== USERS ==========
        // Tài khoản SUPER_ADMIN
        if (this.userRepository.findByEmail("admin@gmail.com").isEmpty()) {
            User adminUser = new User();
            adminUser.setEmail("admin@gmail.com");
            adminUser.setAvatar("https://wellavn.com/wp-content/uploads/2025/07/anh-gai-xinh-2k-12.jpg");
            adminUser.setFirstName("Super");
            adminUser.setLastName("Admin");
            adminUser.setGender(genderEnum.MALE);
            adminUser.setPassword(this.passwordEncoder.encode("123456"));
            adminUser.setIs_admin(true);
            adminUser.setRole(superAdminRole);
            this.userRepository.save(adminUser);
        }

        // Tài khoản SHOP_OWNER mặc định (A)
        if (this.userRepository.findByEmail("shop@gmail.com").isEmpty()) {
            User shopUser = new User();
            shopUser.setEmail("shop@gmail.com");
            shopUser.setAvatar("https://wellavn.com/wp-content/uploads/2025/07/anh-gai-xinh-2k-12.jpg");
            shopUser.setFirstName("Chủ");
            shopUser.setLastName("Quán Phở");
            shopUser.setGender(genderEnum.MALE);
            shopUser.setPassword(this.passwordEncoder.encode("123456"));
            shopUser.setIs_admin(false);
            shopUser.setRole(shopOwnerRole);
            this.userRepository.save(shopUser);
        }

        // SHOP_OWNER thứ hai (B) — dashboard Top POI / real-time chỉ thấy POI do chính user này tạo
        if (this.userRepository.findByEmail("shop2@gmail.com").isEmpty()) {
            User shopB = new User();
            shopB.setEmail("shop2@gmail.com");
            shopB.setAvatar("https://wellavn.com/wp-content/uploads/2025/07/anh-gai-xinh-2k-12.jpg");
            shopB.setFirstName("Chủ");
            shopB.setLastName("Quán Bánh Cuốn");
            shopB.setGender(genderEnum.FEMALE);
            shopB.setPassword(this.passwordEncoder.encode("123456"));
            shopB.setIs_admin(false);
            shopB.setRole(shopOwnerRole);
            this.userRepository.save(shopB);
        }

        System.out.println(">>> END INIT DATABASE");
    }

}

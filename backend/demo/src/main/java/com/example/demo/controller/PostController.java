package com.example.demo.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.domain.Post;
import com.example.demo.domain.User;
import com.example.demo.domain.dto.ResultPaginationDTO;
import com.example.demo.domain.response.PostResponseDTO;
import com.example.demo.service.PostService;
import com.example.demo.service.UserServices;
import com.example.demo.util.annotation.ApiMessage;
import com.example.demo.util.error.IdInvalidException;
import com.turkraft.springfilter.boot.Filter;

@RestController
@RequestMapping("/api/v1/posts")
public class PostController {

    @Autowired
    private PostService postService;

    @Autowired
    private UserServices userService;

    @Value("${url_backend_image_and_video}")
    private String urlBackend;

    private static final String UPLOAD_DIR = "uploads/";

    @PostMapping("/create")
    @ApiMessage("Create a post")
    public ResponseEntity<PostResponseDTO> createPost(
            @RequestParam("content") String content,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "userId", required = false) Long userId) throws IOException, IdInvalidException {

        if (userId == null) {
            throw new IdInvalidException(
                    "User với id = " + userId + " không tồn tại... (truyền param không có trong databae)");
        }

        User user = userService.handleFindByIdUser(userId);
        if (user == null) {
            throw new IdInvalidException("User với id = " + userId + " không tồn tại...");
        }

        String fileUrl = null;
        String imageUrl = null;
        String videoUrl = null;

        if (file != null && !file.isEmpty()) {
            String originalFileName = file.getOriginalFilename();
            String safeFileName = originalFileName.replaceAll("\\s+", "_");
            String uuidFileName = UUID.randomUUID().toString() + "_" + safeFileName;
            String subDir = "";

            if (file.getContentType().startsWith("image/")) {
                subDir = "post/img/";
                imageUrl = urlBackend + "/uploads/" + subDir + uuidFileName;
            } else if (file.getContentType().startsWith("video/")) {
                subDir = "post/video/";
                videoUrl = urlBackend + "/uploads/" + subDir + uuidFileName;
            }

            if (!subDir.isEmpty()) {
                Path filePath = Paths.get(UPLOAD_DIR + subDir + uuidFileName);
                Files.createDirectories(filePath.getParent());
                Files.write(filePath, file.getBytes());
            }
        }

        Post post = new Post();
        post.setContent(content);
        post.setImageUrl(imageUrl);
        post.setVideoUrl(videoUrl);
        post.setUser(user);
        post.setCreatedAt(LocalDateTime.now());
        post.setUpdatedAt(LocalDateTime.now());

        Post created = postService.createPost(post);
        PostResponseDTO postDTO = postService.mapToPostResponseDTO(created);
        return ResponseEntity.ok(postDTO);
    }

    @DeleteMapping("/{postId}/user/{userId}")
    @ApiMessage("Delete a post by owner")
    public ResponseEntity<Map<String, String>> deletePostByOwner(@PathVariable Long postId, @PathVariable Long userId)
            throws IdInvalidException {
        boolean deleted = postService.deletePostByOwner(postId, userId);
        if (!deleted) {
            throw new IdInvalidException("You are not allowed to delete this post");
        } else {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Đã xóa thành công");
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping
    public ResponseEntity<List<Post>> getAllPosts() {
        // Sử dụng getAllVisiblePosts() để chỉ lấy bài viết có visible=true và chưa bị
        // xóa
        return null;
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Post>> getPostsByUser(@PathVariable Long userId) {
        User user = userService.handleFindByIdUser(userId);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        // Sử dụng getVisiblePostsByUser() để chỉ lấy bài viết có visible=true và chưa
        // bị xóa
        return ResponseEntity.ok(postService.getVisiblePostsByUser(user));
    }

    @GetMapping("/user/{userId}/shares")
    public ResponseEntity<List<Post>> getSharedPostsByUser(@PathVariable Long userId) {
        User user = userService.handleFindByIdUser(userId);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        // Sử dụng getVisibleSharedPostsByUser() để chỉ lấy bài viết có visible=true và
        // chưa bị xóa
        return null;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPostById(@PathVariable Long id) {
        // Sử dụng getNotDeletedPostById() để chỉ lấy bài viết chưa bị xóa
        Optional<Post> postOpt = postService.getNotDeletedPostById(id);

        // Kiểm tra thêm điều kiện visible=true
        if (postOpt.isPresent() && (postOpt.get().getVisible() == null || !postOpt.get().getVisible())) {
            return ResponseEntity.notFound().build();
        }

        return postOpt.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePost(@PathVariable Long id, @RequestBody Post postUpdate) {
        Post updated = postService.updatePost(id, postUpdate);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @GetMapping("/user/{userId}/feed")
    public ResponseEntity<List<Post>> getUserFeed(@PathVariable Long userId) {
        User user = userService.handleFindByIdUser(userId);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        // Lấy danh sách bạn bè của người dùng
        // List<User> friends = friendService.getFriendsByUserId(userId);
        // Thêm người dùng hiện tại vào danh sách để lấy cả bài viết của họ
        // friends.add(user);
        // Lấy tất cả bài viết của người dùng và bạn bè
        return null;
    }

    @GetMapping("/fetch-all")
    @ApiMessage("fetch all posts")
    public ResponseEntity<ResultPaginationDTO> getAllPosts(
            @Filter Specification<Post> spec,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "100") int size) {

        Pageable pageable = PageRequest.of(page - 1, size);
        ResultPaginationDTO result = postService.fetchAllPosts(spec, pageable);
        return ResponseEntity.status(HttpStatus.OK).body(result);
    }

}
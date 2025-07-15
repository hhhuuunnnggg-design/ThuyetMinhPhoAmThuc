package com.example.demo.service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.example.demo.domain.Post;
import com.example.demo.domain.User;
import com.example.demo.domain.dto.ResultPaginationDTO;
import com.example.demo.domain.response.PostResponseDTO;
import com.example.demo.repository.PostRepository;

@Service
public class PostService {

    @Autowired
    private PostRepository postRepository;

    // Tạo bài viết mới
    public Post createPost(Post post) {
        return postRepository.save(post);
    }

    // Lấy tất cả bài viết (cho admin) - bao gồm cả bài viết đã xóa
    public List<Post> getAllPosts() {
        List<Post> posts = postRepository.findAll();
        // Sắp xếp bài viết theo thời gian tạo mới nhất
        posts.sort(Comparator.comparing(Post::getCreatedAt).reversed());
        return posts;
    }

    // Lấy tất cả bài viết chưa bị xóa (cho admin)
    public List<Post> getAllNotDeletedPosts() {
        List<Post> posts = postRepository.findByDeletedAtIsNull();
        // Sắp xếp bài viết theo thời gian tạo mới nhất
        posts.sort(Comparator.comparing(Post::getCreatedAt).reversed());
        return posts;
    }

    // Lấy tất cả bài viết có visible=true và chưa bị xóa (cho người dùng thông
    // thường)

    // Lấy bài viết theo id
    public Optional<Post> getPostById(Long id) {
        return postRepository.findById(id);
    }

    // Lấy bài viết chưa bị xóa theo id
    public Optional<Post> getNotDeletedPostById(Long id) {
        Optional<Post> post = postRepository.findById(id);
        if (post.isPresent() && post.get().getDeletedAt() == null) {
            return post;
        }
        return Optional.empty();
    }

    // Lấy bài viết của 1 user và sắp xếp theo thời gian tạo mới nhất (cho admin) -
    // bao gồm cả bài viết đã xóa
    public List<Post> getPostsByUser(User user) {
        return postRepository.findByUserOrderByCreatedAtDesc(user);
    }

    // Lấy bài viết chưa bị xóa của 1 user (cho admin)
    public List<Post> getNotDeletedPostsByUser(User user) {
        return postRepository.findByUserAndDeletedAtIsNullOrderByCreatedAtDesc(user);
    }

    // Lấy bài viết có visible=true và chưa bị xóa của 1 user (cho người dùng thông
    // thường)
    public List<Post> getVisiblePostsByUser(User user) {
        return postRepository.findByUserAndVisibleTrueAndDeletedAtIsNullOrderByCreatedAtDesc(user);
    }

    // Lấy danh sách bài viết có phân trang và tìm kiếm (bao gồm cả bài viết đã xóa
    // - chỉ dùng cho admin cấp cao)
    public Page<Post> getPosts(Long userId, String searchTerm, int page, int size, String sortBy, String sortDir) {
        Sort sort = Sort.by(sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        if (userId != null && searchTerm != null && !searchTerm.isEmpty()) {
            return postRepository.findByUserIdAndContentContaining(userId, searchTerm, pageable);
        } else if (userId != null) {
            return postRepository.findByUserId(userId, pageable);
        } else if (searchTerm != null && !searchTerm.isEmpty()) {
            return postRepository.findByContentContaining(searchTerm, pageable);
        } else {
            return postRepository.findAll(pageable);
        }
    }

    // Lấy danh sách bài viết chưa bị xóa mềm có phân trang và tìm kiếm
    // public Page<Post> getNotDeletedPosts(Long userId, String searchTerm, int
    // page, int size, String sortBy,
    // String sortDir) {
    // Sort sort = Sort.by(sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC :
    // Sort.Direction.DESC, sortBy);
    // Pageable pageable = PageRequest.of(page, size, sort);

    // if (userId != null && searchTerm != null && !searchTerm.isEmpty()) {
    // // Tìm kiếm theo userId và (nội dung hoặc thông tin người dùng)
    // return postRepository.findByUserIdAndContentOrUserInfo(userId, searchTerm,
    // pageable);
    // } else if (userId != null) {
    // return postRepository.findByUserId(userId, pageable);
    // } else if (searchTerm != null && !searchTerm.isEmpty()) {
    // // Tìm kiếm theo nội dung hoặc thông tin người dùng
    // return postRepository.findByContentOrUserInfo(searchTerm, pageable);
    // } else {
    // return postRepository.findAllNotDeleted(pageable);
    // }
    // }

    // Cập nhật trạng thái hiển thị của bài viết
    public Post updatePostVisibility(Long id, boolean visible) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết với ID: " + id));

        post.setVisible(visible);
        post.setUpdatedAt(LocalDateTime.now());
        return postRepository.save(post);
    }

    public Post updatePost(Long id, Post postUpdate) {
        return postRepository.findById(id)
                .map(existingPost -> {
                    existingPost.setContent(postUpdate.getContent());
                    existingPost.setImageUrl(postUpdate.getImageUrl());
                    existingPost.setVideoUrl(postUpdate.getVideoUrl());
                    existingPost.setUpdatedAt(LocalDateTime.now());
                    return postRepository.save(existingPost);
                })
                .orElse(null);
    }

    // Xoá mềm bài viết
    public boolean deletePost(Long id) {
        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isPresent()) {
            Post post = postOpt.get();
            post.setDeletedAt(LocalDateTime.now());
            postRepository.save(post);
            return true;
        }
        return false;
    }

    // Khôi phục bài viết đã xóa
    public boolean restorePost(Long id) {
        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isPresent()) {
            Post post = postOpt.get();
            post.setDeletedAt(null);
            postRepository.save(post);
            return true;
        }
        return false;
    }

    // Xóa vĩnh viễn bài viết (hard delete - chỉ dành cho admin)
    public boolean permanentDeletePost(Long id) {
        if (postRepository.existsById(id)) {
            postRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // Đếm tổng số bài viết (bao gồm cả bài viết đã xóa)
    public long countAllPosts() {
        return postRepository.count();
    }

    // Đếm tổng số bài viết chưa bị xóa
    public long countAllNotDeletedPosts() {
        return postRepository.countByDeletedAtIsNull();
    }

    // Đếm số bài viết được tạo trong n ngày qua (chỉ đếm bài viết chưa bị xóa)
    public int countPostsInLastDays(int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        return postRepository.countByCreatedAtAfterAndDeletedAtIsNull(startDate);
    }

    // Lấy danh sách bài viết đã bị xóa có phân trang
    public Page<Post> getDeletedPosts(Pageable pageable) {
        return postRepository.findByDeletedAtIsNotNull(pageable);
    }

    /**
     * Đếm số lượng bài viết của một người dùng
     */
    public long countPostsByUser(User user) {
        return postRepository.countByUserAndDeletedAtIsNull(user);
    }

    /**
     * Lấy các bài viết gần đây của một người dùng
     */
    public List<Post> getRecentPostsByUser(User user, int limit) {
        Pageable pageable = PageRequest.of(0, limit, Sort.by("createdAt").descending());
        Page<Post> postPage = postRepository.findByUserAndDeletedAtIsNull(user, pageable);
        return postPage.getContent();
    }

    public List<Post> getPostsByUsers(List<User> users) {
        return postRepository.findByUserInAndVisibleTrueAndDeletedAtIsNullOrderByCreatedAtDesc(users);
    }

    // Map Post entity to PostResponseDTO
    public PostResponseDTO mapToPostResponseDTO(Post post) {
        if (post == null)
            return null;
        PostResponseDTO dto = new PostResponseDTO();
        dto.setId(post.getId());
        dto.setContent(post.getContent());
        dto.setImageUrl(post.getImageUrl());
        dto.setVideoUrl(post.getVideoUrl());
        dto.setVisible(post.getVisible());
        dto.setDeletedAt(post.getDeletedAt());
        dto.setCreatedAt(post.getCreatedAt());
        dto.setUpdatedAt(post.getUpdatedAt());
        dto.setShareId(post.getShareId());
        dto.setSharedAt(post.getSharedAt());
        // Map user
        if (post.getUser() != null) {
            PostResponseDTO.UserSummaryDTO userDTO = new PostResponseDTO.UserSummaryDTO();
            userDTO.setId(post.getUser().getId());
            userDTO.setEmail(post.getUser().getEmail());
            userDTO.setFullname(post.getUser().getLastName() + " " + post.getUser().getFirstName());
            userDTO.setAvatar(post.getUser().getAvatar());
            userDTO.setCoverPhoto(post.getUser().getCoverPhoto());
            userDTO.setGender(post.getUser().getGender() != null ? post.getUser().getGender().toString() : null);
            dto.setUser(userDTO);
        }
        return dto;
    }

    // Xóa post chỉ khi userId là chủ post
    public boolean deletePostByOwner(Long postId, Long userId) {
        Optional<Post> postOpt = postRepository.findById(postId);
        if (postOpt.isPresent()) {
            Post post = postOpt.get();
            if (post.getUser() != null && post.getUser().getId().equals(userId)) {
                post.setDeletedAt(LocalDateTime.now());
                postRepository.deleteById(postId);
                return true;
            }
        }
        return false;
    }

    public ResultPaginationDTO fetchAllPosts(Specification<Post> spec, Pageable pageable) {
        Page<Post> page = postRepository.findAll(spec, pageable);
        List<PostResponseDTO> postDTOs = page.getContent().stream()
                .map(this::mapToPostResponseDTO)
                .toList();
        ResultPaginationDTO result = new ResultPaginationDTO();
        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        meta.setPage(pageable.getPageNumber() + 1);
        meta.setPageSize(pageable.getPageSize());
        meta.setTotal(page.getTotalElements());
        meta.setPages(page.getTotalPages());
        result.setMeta(meta);
        result.setResult(postDTOs);
        return result;
    }
}
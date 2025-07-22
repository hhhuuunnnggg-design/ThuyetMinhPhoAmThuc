package com.example.demo.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.domain.Comment;
import com.example.demo.domain.Post;
import com.example.demo.domain.User;
import com.example.demo.domain.response.ResComentsByIdDTO;
import com.example.demo.repository.CommentRepository;

@Service
public class CommentService {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private PostService postService;

    @Autowired
    private UserServices userService;

    // Thêm bình luận (dùng cho API POST /api/comments)
    public Comment addComment(Long postId, Long userId, String content) {
        Post post = postService.getPostById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        User user = userService.handleFindByIdUser(userId);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        Comment comment = new Comment();
        comment.setPost(post);
        comment.setUser(user);
        comment.setContent(content);
        return commentRepository.save(comment);
    }

    // Method cũ, không còn dùng vì controller gọi method bên dưới
    public Comment createComment(Comment comment) {
        return commentRepository.save(comment);
    }

    // Lấy danh sách bình luận của bài viết (dùng cho API GET
    // /api/comments?postId={postId})
    public List<Comment> getCommentsByPost(Long postId) {
        Post post = postService.getPostById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        return commentRepository.findByPost(post);
    }

    // Lấy bình luận theo id (dùng cho API GET /api/comments/{id})
    public Optional<Comment> getCommentById(Long id) {
        return commentRepository.findById(id);
    }

    // Cập nhật bình luận (dùng cho API PUT /api/comments/{id})
    public Comment updateComment(Long id, Comment commentUpdate) {
        Optional<Comment> existingCommentOpt = commentRepository.findById(id);
        if (existingCommentOpt.isPresent()) {
            Comment existingComment = existingCommentOpt.get();
            existingComment.setContent(commentUpdate.getContent());
            return commentRepository.save(existingComment);
        }
        return null;
    }

    // Xóa bình luận (dùng cho API DELETE /api/comments/{id})
    public boolean deleteComment(Long id) {
        if (commentRepository.existsById(id)) {
            commentRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // Đếm tổng số bình luận
    public long countAllComments() {
        return commentRepository.count();
    }

    // Đếm số bình luận được tạo trong n ngày qua
    public int countCommentsInLastDays(int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        return commentRepository.countByCreatedAtAfter(startDate);
    }

    // Đếm số lượng comment của một bài viết
    public int countCommentsByPost(Post post) {
        return commentRepository.findByPost(post).size();
    }

    // Đếm số lượng comment của một bài viết theo postId
    public int countCommentsByPostId(Long postId) {
        Post post = postService.getPostById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        return countCommentsByPost(post);
    }

    /**
     * Đếm số lượng bình luận của một người dùng
     */
    public long countCommentsByUser(User user) {
        return commentRepository.countByUser(user);
    }

    public List<ResComentsByIdDTO> convertToResComentsByIdDTO(Long postId) {
        List<Comment> comments = getCommentsByPost(postId);
        return comments.stream().map(comment -> {
            // Convert User
            ResComentsByIdDTO.UserGetAccount userDto = new ResComentsByIdDTO.UserGetAccount(
                    comment.getUser().getId(),
                    comment.getUser().getEmail(),
                    comment.getUser().getFirstName() + " " + comment.getUser().getLastName(),
                    comment.getUser().getAvatar(),
                    comment.getUser().getIs_blocked());
            // Convert Post
            ResComentsByIdDTO.Post postDto = new ResComentsByIdDTO.Post(
                    comment.getPost().getId(),
                    comment.getPost().getContent(),
                    comment.getPost().getImageUrl(),
                    comment.getPost().getVideoUrl());
            // Convert Comment
            return new ResComentsByIdDTO(
                    comment.getId(),
                    comment.getContent(),
                    comment.getCreatedAt().toString(),
                    userDto,
                    postDto);
        }).toList();
    }

    // tìm 1 giá trị
    public Post handleFindByIdPost(Long id) {
        Optional<Post> PostOption = postService.getPostById(id);
        if (PostOption.isPresent()) {
            return PostOption.get();
        }
        return null;
    }
}
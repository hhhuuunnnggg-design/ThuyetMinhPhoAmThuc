package com.example.demo.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.Comment;
import com.example.demo.domain.Post;
import com.example.demo.domain.User;
import com.example.demo.domain.response.CommentMessage;
import com.example.demo.domain.response.ResComentsByIdDTO;
import com.example.demo.service.CommentService;
import com.example.demo.service.PostService;
import com.example.demo.service.UserServices;
import com.example.demo.util.error.IdInvalidException;

@RestController
@RequestMapping("/api/v1/comments")
public class CommentController {

    @Autowired
    private CommentService commentService;

    @Autowired
    private UserServices userService;

    @Autowired
    private WebSocketController webSocketController;

    // @Autowired
    // private NotificationService notificationService;

    @Autowired
    private PostService postService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Tạo bình luận mới
    @PostMapping("/create")
    public ResponseEntity<ResComentsByIdDTO> addComment(
            @RequestParam Long postId,
            @RequestParam Long userId,
            @RequestParam String content) {
        Comment created = commentService.addComment(postId, userId, content);

        // Gửi thông báo realtime
        User sender = userService.handleFindByIdUser(userId);
        User receiver = userService.getUserByPostId(postId);

        if (sender != null && receiver != null && sender.getId() != receiver.getId()) {
            System.out.println("Gửi thông báo realtime");
            // Notification notification = new Notification();
            // String contentNoti = sender.getFirstName() + " " + sender.getLastName() + "đã
            // bình luận bài viết của bạn";
            // notification.setContent(contentNoti);
            // notification.setSender(sender);
            // notification.setReceiver(receiver);
            // notification.setPost(postService.getPostById(postId).orElse(null));
            // notificationService.createNotification(sender.getId(), receiver.getId(),
            // contentNoti,
            // postService.getPostById(postId).orElse(null), null,
            // Notification.NotificationType.COMMENT);
            // webSocketController.notifyNewPost(receiver.getId(), notification);
        }

        // Gửi comment mới qua WebSocket
        ResComentsByIdDTO dto = commentService.convertToResComentsByIdDTO(created);
        webSocketController.broadcastComment(postId, new CommentMessage("NEW_COMMENT", dto));

        return ResponseEntity.ok(dto);
    }

    // Message mapping cho WebSocket
    @MessageMapping("/comment")
    @SendTo("/topic/comments")
    public CommentMessage handleComment(@Payload CommentMessage message) {
        return message;
    }

    @GetMapping
    public ResponseEntity<List<ResComentsByIdDTO>> getCommentsByPost(@RequestParam Long postId)
            throws IdInvalidException {
        Post post = commentService.handleFindByIdPost(postId);
        if (post == null) {
            throw new IdInvalidException("không tồn tại bài post với id: " + postId);
        }
        List<ResComentsByIdDTO> dtos = commentService.convertToResComentsByIdDTO(postId);
        return ResponseEntity.ok(dtos);
    }

    // Lấy bình luận theo id
    @GetMapping("/{id}")
    public ResponseEntity<?> getCommentById(@PathVariable Long id) {
        Optional<Comment> commentOpt = commentService.getCommentById(id);
        return commentOpt.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Cập nhật bình luận
    @PutMapping("/{id}")
    public ResponseEntity<?> updateComment(@PathVariable Long id, @RequestBody Comment commentUpdate) {
        Comment updated = commentService.updateComment(id, commentUpdate);
        if (updated != null) {
            // Gửi thông báo cập nhật comment qua WebSocket
            webSocketController.broadcastComment(updated.getPost().getId(),
                    new CommentMessage("UPDATE_COMMENT", updated));
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    // Xoá bình luận
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteComment(@PathVariable Long id) {
        Comment comment = commentService.getCommentById(id).orElse(null);
        boolean deleted = commentService.deleteComment(id);
        if (deleted && comment != null) {
            // Gửi thông báo xóa comment qua WebSocket
            webSocketController.broadcastComment(comment.getPost().getId(),
                    new CommentMessage("DELETE_COMMENT", id));
            return ResponseEntity.ok("Comment deleted successfully");
        }
        return ResponseEntity.notFound().build();
    }

    // Lấy số lượng comment của bài viết
    @GetMapping("/count")
    public ResponseEntity<?> countCommentsByPost(@RequestParam Long postId) {
        if (postId == null) {
            return ResponseEntity.badRequest().body(null);
        }
        try {
            int count = commentService.countCommentsByPostId(postId);
            return ResponseEntity.ok(java.util.Map.of("count", count));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    // public ResComentsByIdDTO convertToResComentsByIdDTO(Comment comment) {
    // ResComentsByIdDTO.UserGetAccount userDto = new
    // ResComentsByIdDTO.UserGetAccount(
    // comment.getUser().getId(),
    // comment.getUser().getEmail(),
    // comment.getUser().getFirstName() + " " + comment.getUser().getLastName(),
    // comment.getUser().getAvatar(),
    // comment.getUser().getIs_blocked());
    // ResComentsByIdDTO.Post postDto = new ResComentsByIdDTO.Post(
    // comment.getPost().getId(),
    // comment.getPost().getContent(),
    // comment.getPost().getImageUrl(),
    // comment.getPost().getVideoUrl());
    // return new ResComentsByIdDTO(
    // comment.getId(),
    // comment.getContent(),
    // comment.getCreatedAt().toString(),
    // userDto,
    // postDto);
    // }

}
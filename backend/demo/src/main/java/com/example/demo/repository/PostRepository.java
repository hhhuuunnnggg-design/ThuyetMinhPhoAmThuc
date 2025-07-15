package com.example.demo.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.domain.Post;
import com.example.demo.domain.User;

@Repository
public interface PostRepository extends JpaRepository<Post, Long>, JpaSpecificationExecutor<Post> {
        // Lấy tất cả các bài post của 1 user
        List<Post> findByUser(User user);

        // Lấy tất cả các bài post của 1 user chưa bị xóa
        List<Post> findByUserAndDeletedAtIsNull(User user);

        // Lấy tất cả các bài post của 1 user và sắp xếp theo thời gian tạo mới nhất
        List<Post> findByUserOrderByCreatedAtDesc(User user);

        // Lấy tất cả các bài post của 1 user chưa bị xóa và sắp xếp theo thời gian tạo
        // mới nhất
        List<Post> findByUserAndDeletedAtIsNullOrderByCreatedAtDesc(User user);

        // Lấy tất cả các bài post có visible=true
        List<Post> findByVisibleTrue();

        // Lấy tất cả các bài post có visible=true và chưa bị xóa
        List<Post> findByVisibleTrueAndDeletedAtIsNull();

        // Lấy tất cả các bài post của 1 user có visible=true
        List<Post> findByUserAndVisibleTrueOrderByCreatedAtDesc(User user);

        // Lấy tất cả các bài post của 1 user có visible=true và chưa bị xóa
        List<Post> findByUserAndVisibleTrueAndDeletedAtIsNullOrderByCreatedAtDesc(User user);

        // Lấy tất cả các bài post chưa bị xóa
        List<Post> findByDeletedAtIsNull();

        // Lấy tất cả các bài post đã bị xóa
        List<Post> findByDeletedAtIsNotNull();

        // Lấy tất cả các bài post đã bị xóa có phân trang
        Page<Post> findByDeletedAtIsNotNull(Pageable pageable);

        // Tìm kiếm bài viết theo nội dung (chỉ lấy bài viết chưa bị xóa)
        @Query("SELECT p FROM Post p WHERE LOWER(p.content) LIKE LOWER(CONCAT('%', :searchTerm, '%')) AND p.deletedAt IS NULL")
        Page<Post> findByContentContaining(@Param("searchTerm") String searchTerm, Pageable pageable);

        // Tìm kiếm bài viết theo người dùng và nội dung (chỉ lấy bài viết chưa bị xóa)
        @Query("SELECT p FROM Post p WHERE p.user.id = :userId AND LOWER(p.content) LIKE LOWER(CONCAT('%', :searchTerm, '%')) AND p.deletedAt IS NULL")
        Page<Post> findByUserIdAndContentContaining(@Param("userId") Long userId,
                        @Param("searchTerm") String searchTerm,
                        Pageable pageable);

        // Lấy bài viết theo người dùng có phân trang (chỉ lấy bài viết chưa bị xóa)
        @Query("SELECT p FROM Post p WHERE p.user.id = :userId AND p.deletedAt IS NULL")
        Page<Post> findByUserId(@Param("userId") Long userId, Pageable pageable);

        // Lấy tất cả bài viết có phân trang (chỉ lấy bài viết chưa bị xóa)
        @Query("SELECT p FROM Post p WHERE p.deletedAt IS NULL")
        Page<Post> findAllNotDeleted(Pageable pageable);

        // Đếm số bài viết được tạo sau một ngày cụ thể (chỉ đếm bài viết chưa bị xóa)
        @Query("SELECT COUNT(p) FROM Post p WHERE p.createdAt > :date AND p.deletedAt IS NULL")
        int countByCreatedAtAfterAndDeletedAtIsNull(@Param("date") LocalDateTime date);

        // Đếm tổng số bài viết chưa bị xóa
        long countByDeletedAtIsNull();

        // Tìm kiếm bài viết theo nội dung hoặc thông tin người dùng (username,
        // firstName, lastName)

        // Tìm kiếm bài viết theo người dùng và (nội dung hoặc thông tin người dùng)

        // Đếm số bài viết của một người dùng chưa bị xóa
        long countByUserAndDeletedAtIsNull(User user);

        // Lấy bài viết của một người dùng có phân trang (chỉ lấy bài viết chưa bị xóa)
        Page<Post> findByUserAndDeletedAtIsNull(User user, Pageable pageable);

        List<Post> findByUserInAndVisibleTrueAndDeletedAtIsNullOrderByCreatedAtDesc(List<User> users);
}
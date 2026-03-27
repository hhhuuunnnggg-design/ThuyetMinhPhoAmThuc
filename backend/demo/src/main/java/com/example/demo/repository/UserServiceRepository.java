package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.domain.User;

@Repository
public interface UserServiceRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.role r LEFT JOIN FETCH r.permissions WHERE u.email = :email")
    Optional<User> findByEmailWithRolePermissions(@Param("email") String email);

    Optional<User> findByEmail(String email);
    Optional<User> findByRefreshTokenAndEmail(String token, String email);
    boolean existsByEmail(String email);
}

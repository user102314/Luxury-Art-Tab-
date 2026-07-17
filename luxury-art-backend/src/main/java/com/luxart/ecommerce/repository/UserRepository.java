package com.luxart.ecommerce.repository;

import com.luxart.ecommerce.model.entity.User;
import com.luxart.ecommerce.model.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByRoleOrderByCreatedAtDesc(Role role);
}

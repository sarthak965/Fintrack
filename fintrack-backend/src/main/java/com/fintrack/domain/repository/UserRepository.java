package com.fintrack.domain.repository;

import com.fintrack.domain.model.User;
import java.util.Optional;

public interface UserRepository {
    /*I used Optional return types to avoid null pointer
    exceptions and force callers to explicitly handle the case where an entity doesn't exist. */
    User save(User user);

    Optional<User> findByEmail(String email);

    Optional<User> findById(Long id);

    Boolean existsByEmail(String email);
}
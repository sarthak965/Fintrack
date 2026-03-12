package com.fintrack.domain.repository;

import com.fintrack.domain.model.Category;
import java.util.List;
import java.util.Optional;

public interface CategoryRepository {
    Category save(Category category);
    List<Category> findByUserId(Long userId);
    Optional<Category> findById(Long id);
    void deleteById(Long id);
    boolean existsByUserIdAndName(Long userId, String name);
}
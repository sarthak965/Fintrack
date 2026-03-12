package com.fintrack.infrastructure.persistence;

import com.fintrack.domain.model.Category;
import com.fintrack.domain.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class CategoryRepositoryImpl implements CategoryRepository {
    private final JpaCategoryRepository jpa;

    @Override public Category save(Category c) { return jpa.save(c); }
    @Override public List<Category> findByUserId(Long userId) { return jpa.findByUserId(userId); }
    @Override public Optional<Category> findById(Long id) { return jpa.findById(id); }
    @Override public void deleteById(Long id) { jpa.deleteById(id); }
    @Override public boolean existsByUserIdAndName(Long userId, String name) { return jpa.existsByUserIdAndName(userId, name); }
}
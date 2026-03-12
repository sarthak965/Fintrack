package com.fintrack.application.service;

import com.fintrack.api.dto.CategoryRequest;
import com.fintrack.api.dto.CategoryResponse;
import com.fintrack.domain.model.Category;
import com.fintrack.domain.model.User;
import com.fintrack.domain.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<CategoryResponse> getCategories(User user) {
        return categoryRepository.findByUserId(user.getId())
                .stream().map(this::toResponse).toList();
    }

    public CategoryResponse createCategory(User user, CategoryRequest req) {
        Category category = Category.builder()
                .user(user)
                .name(req.getName())
                .icon(req.getIcon())
                .color(req.getColor())
                .type(req.getType().toUpperCase())
                .build();
        return toResponse(categoryRepository.save(category));
    }

    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }

    // Auto-create 12 default categories on user registration
    public void createDefaultCategories(User user) {
        List<Object[]> defaults = List.of(
                new Object[]{"Food & Dining", "utensils", "#f97316", "EXPENSE"},
                new Object[]{"Transportation", "car", "#3b82f6", "EXPENSE"},
                new Object[]{"Shopping", "shopping-bag", "#ec4899", "EXPENSE"},
                new Object[]{"Entertainment", "film", "#8b5cf6", "EXPENSE"},
                new Object[]{"Bills & Utilities", "file-text", "#ef4444", "EXPENSE"},
                new Object[]{"Healthcare", "heart-pulse", "#22c55e", "EXPENSE"},
                new Object[]{"Education", "graduation-cap", "#06b6d4", "EXPENSE"},
                new Object[]{"Travel", "plane", "#eab308", "EXPENSE"},
                new Object[]{"Salary", "wallet", "#22c55e", "INCOME"},
                new Object[]{"Freelance", "laptop", "#3b82f6", "INCOME"},
                new Object[]{"Investments", "trending-up", "#8b5cf6", "INCOME"},
                new Object[]{"Other Income", "plus-circle", "#06b6d4", "INCOME"}
        );

        defaults.forEach(d -> {
            if (!categoryRepository.existsByUserIdAndName(user.getId(), (String) d[0])) {
                categoryRepository.save(Category.builder()
                        .user(user)
                        .name((String) d[0])
                        .icon((String) d[1])
                        .color((String) d[2])
                        .type((String) d[3])
                        .build());
            }
        });
    }

    private CategoryResponse toResponse(Category c) {
        return CategoryResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .icon(c.getIcon())
                .color(c.getColor())
                .type(c.getType())
                .userId(c.getUser().getId())
                .build();
    }
}
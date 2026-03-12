package com.fintrack.domain.repository;

import com.fintrack.domain.model.Goal;
import java.util.List;
import java.util.Optional;

public interface GoalRepository {
    Goal save(Goal goal);
    List<Goal> findByUserId(Long userId);
    Optional<Goal> findById(Long id);
    void deleteById(Long id);
}
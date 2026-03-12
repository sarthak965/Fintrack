package com.fintrack.infrastructure.persistence;

import com.fintrack.domain.model.Goal;
import com.fintrack.domain.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class GoalRepositoryImpl implements GoalRepository {
    private final JpaGoalRepository jpa;

    @Override public Goal save(Goal g) { return jpa.save(g); }
    @Override public List<Goal> findByUserId(Long userId) { return jpa.findByUserId(userId); }
    @Override public Optional<Goal> findById(Long id) { return jpa.findById(id); }
    @Override public void deleteById(Long id) { jpa.deleteById(id); }
}
package com.fintrack.infrastructure.persistence;

import com.fintrack.domain.model.Goal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface JpaGoalRepository extends JpaRepository<Goal, Long> {
    List<Goal> findByUserId(Long userId);
}
package com.fintrack.application.service;

import com.fintrack.api.dto.GoalRequest;
import com.fintrack.api.dto.GoalResponse;
import com.fintrack.domain.model.Goal;
import com.fintrack.domain.model.User;
import com.fintrack.domain.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;

    public List<GoalResponse> getGoals(User user) {
        return goalRepository.findByUserId(user.getId())
                .stream().map(this::toResponse).toList();
    }

    public GoalResponse createGoal(User user, GoalRequest req) {
        Goal goal = Goal.builder()
                .user(user)
                .name(req.getName())
                .targetAmount(req.getTargetAmount())
                .currentAmount(req.getCurrentAmount() != null ? req.getCurrentAmount() : BigDecimal.ZERO)
                .deadline(req.getDeadline())
                .category(req.getCategory())
                .build();
        return toResponse(goalRepository.save(goal));
    }

    public GoalResponse updateGoal(Long id, GoalRequest req) {
        Goal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        goal.setName(req.getName());
        goal.setTargetAmount(req.getTargetAmount());
        if (req.getCurrentAmount() != null) goal.setCurrentAmount(req.getCurrentAmount());
        goal.setDeadline(req.getDeadline());
        goal.setCategory(req.getCategory());
        return toResponse(goalRepository.save(goal));
    }

    public void deleteGoal(Long id) {
        goalRepository.deleteById(id);
    }

    private GoalResponse toResponse(Goal g) {
        double progress = g.getTargetAmount().compareTo(BigDecimal.ZERO) > 0
                ? g.getCurrentAmount().divide(g.getTargetAmount(), 4, java.math.RoundingMode.HALF_UP).doubleValue() * 100
                : 0;
        return GoalResponse.builder()
                .id(g.getId())
                .name(g.getName())
                .targetAmount(g.getTargetAmount())
                .currentAmount(g.getCurrentAmount())
                .deadline(g.getDeadline())
                .category(g.getCategory())
                .progress(progress)
                .userId(g.getUser().getId())
                .createdAt(g.getCreatedAt().toString())
                .build();
    }
}
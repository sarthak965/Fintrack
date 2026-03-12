package com.fintrack.api.controller;

import com.fintrack.domain.model.Anomaly;
import com.fintrack.domain.repository.UserRepository;
import com.fintrack.domain.exception.UserNotFoundException;
import com.fintrack.infrastructure.persistence.JpaAnomalyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/anomalies")
@RequiredArgsConstructor
public class AnomalyController {

    private final JpaAnomalyRepository anomalyRepository;
    private final UserRepository userRepository;

    // GET all anomalies for logged-in user
    @GetMapping
    public ResponseEntity<List<Anomaly>> getAnomalies(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new UserNotFoundException("User not found"))
                .getId();
        return ResponseEntity.ok(anomalyRepository.findByUserIdOrderByDetectedAtDesc(userId));
    }

    // GET unread anomaly count (for notification badge on frontend)
    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new UserNotFoundException("User not found"))
                .getId();
        long count = anomalyRepository.findByUserIdAndIsReadFalse(userId).size();
        return ResponseEntity.ok(java.util.Map.of("unreadCount", count));
    }

    // PATCH mark anomaly as read
    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        anomalyRepository.findById(id).ifPresent(anomaly -> {
            anomaly.setIsRead(true);
            anomalyRepository.save(anomaly);
        });
        return ResponseEntity.ok().build();
    }
}
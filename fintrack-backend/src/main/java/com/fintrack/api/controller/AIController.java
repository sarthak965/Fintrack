package com.fintrack.api.controller;

import com.fintrack.api.dto.ChatRequest;
import com.fintrack.application.service.AIFinanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIFinanceService aiFinanceService;

    // POST /api/ai/chat — Ask anything about your finances
    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChatRequest request) {
        String response = aiFinanceService.chat(userDetails.getUsername(), request.getMessage());
        return ResponseEntity.ok(Map.of("response", response));
    }

    // GET /api/ai/saving-tips — Get personalized saving tips
    @GetMapping("/saving-tips")
    public ResponseEntity<Map<String, String>> getSavingTips(
            @AuthenticationPrincipal UserDetails userDetails) {
        String tips = aiFinanceService.getSavingTips(userDetails.getUsername());
        return ResponseEntity.ok(Map.of("tips", tips));
    }

    // GET /api/ai/anomalies — Detect unusual spending
    @GetMapping("/anomalies")
    public ResponseEntity<Map<String, String>> detectAnomalies(
            @AuthenticationPrincipal UserDetails userDetails) {
        String analysis = aiFinanceService.detectAnomalies(userDetails.getUsername());
        return ResponseEntity.ok(Map.of("analysis", analysis));
    }

    // GET /api/ai/health-score — Get financial health score 0-100
    @GetMapping("/health-score")
    public ResponseEntity<Map<String, Object>> getHealthScore(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(aiFinanceService.getHealthScore(userDetails.getUsername()));
    }

    @GetMapping("/insights")
    public ResponseEntity<Map<String, Object>> getInsights(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(aiFinanceService.getInsights(userDetails.getUsername()));
    }

    @PostMapping("/categorize")
    public ResponseEntity<Map<String, String>> categorize(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ChatRequest request) {
        String category = aiFinanceService.categorize(userDetails.getUsername(), request.getMessage());
        return ResponseEntity.ok(Map.of("suggestedCategory", category));
    }
}
package com.fintrack.application.service;

import com.fintrack.domain.model.Transaction;
import com.fintrack.domain.repository.TransactionRepository;
import com.fintrack.domain.repository.UserRepository;
import com.fintrack.domain.exception.UserNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public Map<String, Object> getSummary(String email) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        List<Transaction> transactions = transactionRepository.findByUserId(user.getId());

        BigDecimal totalIncome = transactions.stream()
                .filter(t -> t.getType() == Transaction.TransactionType.INCOME)
                .map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpense = transactions.stream()
                .filter(t -> t.getType() == Transaction.TransactionType.EXPENSE)
                .map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        // Category breakdown
        Map<String, BigDecimal> categoryMap = new LinkedHashMap<>();
        transactions.stream()
                .filter(t -> t.getType() == Transaction.TransactionType.EXPENSE)
                .forEach(t -> categoryMap.merge(t.getCategory(), t.getAmount(), BigDecimal::add));

        List<Map<String, Object>> categoryBreakdown = categoryMap.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .map(e -> Map.<String, Object>of("category", e.getKey(), "amount", e.getValue()))
                .toList();

        // Monthly trends
        Map<String, Map<String, BigDecimal>> monthlyMap = new TreeMap<>();
        transactions.forEach(t -> {
            String month = t.getTransactionDate().format(DateTimeFormatter.ofPattern("yyyy-MM"));
            monthlyMap.computeIfAbsent(month, k -> new HashMap<>());
            String key = t.getType() == Transaction.TransactionType.INCOME ? "income" : "expense";
            monthlyMap.get(month).merge(key, t.getAmount(), BigDecimal::add);
        });

        List<Map<String, Object>> monthlyTrends = monthlyMap.entrySet().stream()
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("month", e.getKey());
                    m.put("income", e.getValue().getOrDefault("income", BigDecimal.ZERO));
                    m.put("expense", e.getValue().getOrDefault("expense", BigDecimal.ZERO));
                    return m;
                }).toList();

        // Weekly trends
        Map<String, BigDecimal> weeklyMap = new TreeMap<>();
        transactions.stream()
                .filter(t -> t.getType() == Transaction.TransactionType.EXPENSE)
                .forEach(t -> {
                    LocalDateTime date = t.getTransactionDate();
                    LocalDateTime weekStart = date.minusDays(date.getDayOfWeek().getValue() - 1);
                    String weekKey = weekStart.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                    weeklyMap.merge(weekKey, t.getAmount(), BigDecimal::add);
                });

        List<Map<String, Object>> weeklyTrends = weeklyMap.entrySet().stream()
                .map(e -> Map.<String, Object>of("week", e.getKey(), "amount", e.getValue()))
                .collect(Collectors.toList());

        // Return last 8 weeks
        int size = weeklyTrends.size();
        if (size > 8) weeklyTrends = weeklyTrends.subList(size - 8, size);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalBalance", totalIncome.subtract(totalExpense));
        result.put("totalIncome", totalIncome);
        result.put("totalExpense", totalExpense);
        result.put("transactionCount", transactions.size());
        result.put("categoryBreakdown", categoryBreakdown);
        result.put("monthlyTrends", monthlyTrends);
        result.put("weeklyTrends", weeklyTrends);
        return result;
    }

    public List<Map<String, Object>> getHeatmap(String email) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        Map<String, BigDecimal> heatmap = new TreeMap<>();
        transactionRepository.findByUserId(user.getId()).stream()
                .filter(t -> t.getType() == Transaction.TransactionType.EXPENSE)
                .forEach(t -> {
                    String day = t.getTransactionDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                    heatmap.merge(day, t.getAmount(), BigDecimal::add);
                });

        return heatmap.entrySet().stream()
                .map(e -> Map.<String, Object>of("date", e.getKey(), "amount", e.getValue()))
                .toList();
    }
}
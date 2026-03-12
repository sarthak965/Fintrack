package com.fintrack.application.service;

import com.fintrack.domain.model.Transaction;
import com.fintrack.domain.model.User;
import com.fintrack.domain.repository.TransactionRepository;
import com.fintrack.domain.repository.UserRepository;
import com.fintrack.domain.exception.UserNotFoundException;
import com.fintrack.infrastructure.ai.GroqService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AIFinanceService {

    private final GroqService geminiService;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final GroqService groqService;

    // Feature 1: Chat with AI about your finances
    public String chat(String email, String userMessage) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        List<Transaction> transactions = transactionRepository.findByUserId(user.getId());
        String financialContext = buildFinancialContext(user.getFullName(), transactions);

        String prompt = financialContext + "\n\nUser question: " + userMessage +
                "\n\nProvide helpful, concise financial advice based on this data.";
        return geminiService.generateContent(prompt);
    }

    // Feature 2: Get personalized saving tips
    public String getSavingTips(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        List<Transaction> transactions = transactionRepository.findByUserId(user.getId());
        String context = buildFinancialContext(user.getFullName(), transactions);

        String prompt = context + "\n\nBased on this spending data, provide 5 specific, actionable saving tips. Be concise and practical.";
        return geminiService.generateContent(prompt);
    }

    // Feature 3: Detect spending anomalies
    public String detectAnomalies(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        List<Transaction> transactions = transactionRepository.findByUserId(user.getId());
        if (transactions.isEmpty()) return "No transactions to analyze.";

        String context = buildFinancialContext(user.getFullName(), transactions);
        String prompt = context + "\n\nAnalyze these transactions and identify any unusual spending patterns or anomalies. List them clearly.";
        return geminiService.generateContent(prompt);
    }

    // Feature 4: Calculate Financial Health Score (0-100)
    public Map<String, Object> getHealthScore(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        List<Transaction> transactions = transactionRepository.findByUserId(user.getId());
        String context = buildFinancialContext(user.getFullName(), transactions);

        String prompt = context + "\n\nCalculate a financial health score from 0-100 for this user. " +
                "Return ONLY a JSON object like: {\"score\": 75, \"grade\": \"B\", \"summary\": \"brief explanation\", " +
                "\"strengths\": [\"point1\"], \"improvements\": [\"point1\"]}. No markdown, just raw JSON.";

        String response = geminiService.generateContent(prompt);

        Map<String, Object> result = new HashMap<>();
        result.put("rawAnalysis", response);
        result.put("transactions", transactions.size());
        return result;
    }

    private String buildFinancialContext(String name, List<Transaction> transactions) {
        if (transactions.isEmpty()) {
            return "User: " + name + "\nNo transactions recorded yet.";
        }

        BigDecimal totalIncome = transactions.stream()
                .filter(t -> t.getType() == Transaction.TransactionType.INCOME)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpense = transactions.stream()
                .filter(t -> t.getType() == Transaction.TransactionType.EXPENSE)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> byCategory = transactions.stream()
                .filter(t -> t.getType() == Transaction.TransactionType.EXPENSE)
                .collect(Collectors.groupingBy(
                        Transaction::getCategory,
                        Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)
                ));

        StringBuilder sb = new StringBuilder();
        sb.append("User Financial Data for: ").append(name).append("\n");
        sb.append("Total Income: ₹").append(totalIncome).append("\n");
        sb.append("Total Expenses: ₹").append(totalExpense).append("\n");
        sb.append("Net Savings: ₹").append(totalIncome.subtract(totalExpense)).append("\n");
        sb.append("Spending by Category:\n");
        byCategory.forEach((cat, amt) -> sb.append("  - ").append(cat).append(": ₹").append(amt).append("\n"));
        sb.append("Recent transactions (last 10):\n");
        transactions.stream().limit(10).forEach(t ->
                sb.append("  - ").append(t.getType()).append(" ₹").append(t.getAmount())
                        .append(" on ").append(t.getCategory())
                        .append(" (").append(t.getDescription()).append(")\n")
        );
        return sb.toString();
    }
    public Map<String, Object> getInsights(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        List<Transaction> transactions = transactionRepository.findByUserId(user.getId());

        BigDecimal totalIncome = transactions.stream()
                .filter(t -> t.getType() == Transaction.TransactionType.INCOME)
                .map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalExpense = transactions.stream()
                .filter(t -> t.getType() == Transaction.TransactionType.EXPENSE)
                .map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> categorySpending = new LinkedHashMap<>();
        transactions.stream()
                .filter(t -> t.getType() == Transaction.TransactionType.EXPENSE)
                .forEach(t -> categorySpending.merge(t.getCategory(), t.getAmount(), BigDecimal::add));

        String prompt = "Analyze this financial data and provide 3-5 specific actionable insights:\n" +
                "Total Income: ₹" + totalIncome + "\nTotal Expenses: ₹" + totalExpense + "\n" +
                "Spending by Category:\n" +
                categorySpending.entrySet().stream()
                        .map(e -> "- " + e.getKey() + ": ₹" + e.getValue())
                        .collect(java.util.stream.Collectors.joining("\n")) +
                "\nProvide numbered insights (1. 2. 3.) with specific numbers.";

        String response = groqService.generateContent(prompt);
        List<String> insights = Arrays.stream(response.split("\n"))
                .filter(l -> !l.isBlank())
                .toList();

        double savingsRate = totalIncome.compareTo(BigDecimal.ZERO) > 0
                ? totalIncome.subtract(totalExpense).divide(totalIncome, 4, java.math.RoundingMode.HALF_UP).doubleValue() * 100
                : 0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("insights", insights);
        result.put("summary", Map.of(
                "totalIncome", totalIncome,
                "totalExpense", totalExpense,
                "savingsRate", savingsRate,
                "topCategory", categorySpending.entrySet().stream()
                        .max(Map.Entry.comparingByValue())
                        .map(Map.Entry::getKey).orElse("N/A")
        ));
        return result;
    }

    public String categorize(String email, String description) {
        String prompt = "Categorize this transaction into exactly ONE category from: " +
                "Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, " +
                "Healthcare, Education, Travel, Salary, Freelance, Investments, Other Income, Other\n" +
                "Transaction: " + description + "\nReply with ONLY the category name.";
        return groqService.generateContent(prompt).trim();
    }
}
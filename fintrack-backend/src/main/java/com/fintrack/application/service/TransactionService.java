package com.fintrack.application.service;

import com.fintrack.api.dto.TransactionRequest;
import com.fintrack.api.dto.TransactionResponse;
import com.fintrack.domain.model.Transaction;
import com.fintrack.domain.model.User;
import com.fintrack.domain.repository.TransactionRepository;
import com.fintrack.domain.repository.UserRepository;
import com.fintrack.domain.exception.UserNotFoundException;
import com.fintrack.infrastructure.ai.GroqService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final AnomalyDetectionService anomalyDetectionService;
    private final GroqService groqService;

    public TransactionResponse addTransaction(String email, TransactionRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        String category;
        if (req.getCategory() == null || req.getCategory().isBlank()) {
            String prompt = "Categorize this transaction into exactly ONE word from this list: " +
                    "FOOD, TRANSPORT, ENTERTAINMENT, HEALTH, SHOPPING, RENT, SALARY, UTILITIES, OTHER\n" +
                    "Transaction description: " + req.getDescription() + "\n" +
                    "Merchant: " + (req.getMerchantName() != null ? req.getMerchantName() : "unknown") + "\n" +
                    "Reply with ONLY the single category word. No explanation, no punctuation.";
            category = groqService.generateContent(prompt).trim().toUpperCase();
        } else {
            category = req.getCategory().toUpperCase();
        }

        Transaction transaction = Transaction.builder()
                .user(user)
                .amount(req.getAmount())
                .category(category)
                .description(req.getDescription())
                .type(Transaction.TransactionType.valueOf(req.getType().toUpperCase()))
                .transactionDate(req.getTransactionDate())
                .merchantName(req.getMerchantName())
                .isAnomaly(false)
                .build();

        Transaction saved = transactionRepository.save(transaction);
        anomalyDetectionService.checkAndPublish(saved, email);
        return toResponse(saved);
    }

    public List<TransactionResponse> getUserTransactions(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        return transactionRepository.findByUserId(user.getId())
                .stream().map(this::toResponse).toList();
    }

    public void deleteTransaction(Long id) {
        transactionRepository.deleteById(id);
    }

    public TransactionResponse getById(Long id) {
        Transaction t = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        return toResponse(t);
    }

    public TransactionResponse updateTransaction(Long id, TransactionRequest req) {
        Transaction t = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        if (req.getAmount() != null) t.setAmount(req.getAmount());
        if (req.getCategory() != null) t.setCategory(req.getCategory().toUpperCase());
        if (req.getDescription() != null) t.setDescription(req.getDescription());
        if (req.getType() != null) t.setType(Transaction.TransactionType.valueOf(req.getType().toUpperCase()));
        if (req.getMerchantName() != null) t.setMerchantName(req.getMerchantName());
        return toResponse(transactionRepository.save(t));
    }

    private TransactionResponse toResponse(Transaction t) {
        return TransactionResponse.builder()
                .id(t.getId())
                .amount(t.getAmount())
                .category(t.getCategory())
                .description(t.getDescription())
                .type(t.getType().name())
                .transactionDate(t.getTransactionDate())
                .merchantName(t.getMerchantName())
                .isAnomaly(t.getIsAnomaly())
                .build();
    }
}
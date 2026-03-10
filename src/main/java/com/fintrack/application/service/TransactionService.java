package com.fintrack.application.service;

import com.fintrack.api.dto.TransactionRequest;
import com.fintrack.api.dto.TransactionResponse;
import com.fintrack.domain.model.Transaction;
import com.fintrack.domain.model.User;
import com.fintrack.domain.repository.TransactionRepository;
import com.fintrack.domain.repository.UserRepository;
import com.fintrack.domain.exception.UserNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public TransactionResponse addTransaction(String email, TransactionRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        Transaction transaction = Transaction.builder()
                .user(user)
                .amount(req.getAmount())
                .category(req.getCategory().toUpperCase())
                .description(req.getDescription())
                .type(Transaction.TransactionType.valueOf(req.getType().toUpperCase()))
                .transactionDate(req.getTransactionDate())
                .merchantName(req.getMerchantName())
                .isAnomaly(false)
                .build();

        Transaction saved = transactionRepository.save(transaction);
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
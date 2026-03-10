package com.fintrack.domain.repository;

import com.fintrack.domain.model.Transaction;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository {
    Transaction save(Transaction transaction);
    Optional<Transaction> findById(Long id);
    List<Transaction> findByUserId(Long userId);
    List<Transaction> findByUserIdAndDateBetween(Long userId, LocalDateTime start, LocalDateTime end);
    List<Transaction> findByUserIdAndCategory(Long userId, String category);
    BigDecimal sumExpensesByUserId(Long userId);
    void deleteById(Long id);
}
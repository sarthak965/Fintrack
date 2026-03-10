package com.fintrack.infrastructure.persistence;

import com.fintrack.domain.model.Transaction;
import com.fintrack.domain.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class TransactionRepositoryImpl implements TransactionRepository {
    private final JpaTransactionRepository jpa;

    @Override public Transaction save(Transaction t) { return jpa.save(t); }
    @Override public Optional<Transaction> findById(Long id) { return jpa.findById(id); }
    @Override public List<Transaction> findByUserId(Long userId) { return jpa.findByUserId(userId); }
    @Override public List<Transaction> findByUserIdAndDateBetween(Long userId, LocalDateTime s, LocalDateTime e) { return jpa.findByUserIdAndTransactionDateBetween(userId, s, e); }
    @Override public List<Transaction> findByUserIdAndCategory(Long userId, String category) { return jpa.findByUserIdAndCategory(userId, category); }
    @Override public BigDecimal sumExpensesByUserId(Long userId) { return jpa.sumExpensesByUserId(userId); }
    @Override public void deleteById(Long id) { jpa.deleteById(id); }
    @Override public BigDecimal avgExpenseByUserIdAndCategory(Long userId, String category) { return jpa.avgExpenseByUserIdAndCategory(userId, category);}
    @Override public Long countByUserIdAndCategory(Long userId, String category) { return jpa.countByUserIdAndCategory(userId, category);}
}
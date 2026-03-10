package com.fintrack.infrastructure.persistence;

import com.fintrack.domain.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface JpaTransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUserId(Long userId);
    List<Transaction> findByUserIdAndTransactionDateBetween(Long userId, LocalDateTime start, LocalDateTime end);
    List<Transaction> findByUserIdAndCategory(Long userId, String category);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.id = :userId AND t.type = 'EXPENSE'")
    BigDecimal sumExpensesByUserId(Long userId);
}
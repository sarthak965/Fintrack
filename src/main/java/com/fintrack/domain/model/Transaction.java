package com.fintrack.domain.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Transaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private String category; // FOOD, TRANSPORT, ENTERTAINMENT, etc.

    @Column(nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type; // INCOME or EXPENSE

    @Column(nullable = false)
    private LocalDateTime transactionDate;

    private String merchantName;
    private Boolean isAnomaly = false;
    private String receiptImageUrl;

    @PrePersist
    protected void onCreate() {
        if (transactionDate == null) transactionDate = LocalDateTime.now();
    }

    public enum TransactionType { INCOME, EXPENSE }
}
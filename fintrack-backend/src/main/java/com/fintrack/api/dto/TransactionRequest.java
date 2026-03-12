package com.fintrack.api.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TransactionRequest {
    @NotNull @Positive
    private BigDecimal amount;


    private String category;

    @NotBlank
    private String description;

    @NotNull
    private String type; // "INCOME" or "EXPENSE"

    private LocalDateTime transactionDate;
    private String merchantName;
}
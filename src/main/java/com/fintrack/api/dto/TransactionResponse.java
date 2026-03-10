package com.fintrack.api.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TransactionResponse {
    private Long id;
    private BigDecimal amount;
    private String category;
    private String description;
    private String type;
    private LocalDateTime transactionDate;
    private String merchantName;
    private Boolean isAnomaly;
}
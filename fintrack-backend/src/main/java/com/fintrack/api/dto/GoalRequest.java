package com.fintrack.api.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GoalRequest {
    @NotBlank
    private String name;
    @NotNull @Positive
    private BigDecimal targetAmount;
    private BigDecimal currentAmount;
    private String deadline;
    private String category;
}
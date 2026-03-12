package com.fintrack.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CategoryRequest {
    @NotBlank
    private String name;
    private String icon;
    private String color;
    @NotBlank
    private String type; // INCOME or EXPENSE
}
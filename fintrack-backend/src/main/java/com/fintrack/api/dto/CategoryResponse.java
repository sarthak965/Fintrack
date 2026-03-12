package com.fintrack.api.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CategoryResponse {
    private Long id;
    private String name;
    private String icon;
    private String color;
    private String type;
    private Long userId;
}
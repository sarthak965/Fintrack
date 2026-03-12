package com.fintrack.domain.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "anomalies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Anomaly {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String amount;

    @Column(nullable = false)
    private String average;

    @Column(nullable = false)
    private String ratio;

    @Column(columnDefinition = "TEXT")
    private String aiExplanation;

    private Boolean isRead = false;

    @Column(nullable = false)
    private LocalDateTime detectedAt;

    @PrePersist
    protected void onCreate() {
        detectedAt = LocalDateTime.now();
    }
}
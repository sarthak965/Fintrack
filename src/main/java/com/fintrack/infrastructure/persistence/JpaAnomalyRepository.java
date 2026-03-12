package com.fintrack.infrastructure.persistence;

import com.fintrack.domain.model.Anomaly;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface JpaAnomalyRepository extends JpaRepository<Anomaly, Long> {
    List<Anomaly> findByUserIdOrderByDetectedAtDesc(Long userId);
    List<Anomaly> findByUserIdAndIsReadFalse(Long userId);
}
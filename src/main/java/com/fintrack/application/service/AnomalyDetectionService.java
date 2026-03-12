package com.fintrack.application.service;

import com.fintrack.config.RabbitMQConfig;
import com.fintrack.domain.model.Transaction;
import com.fintrack.domain.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnomalyDetectionService {

    private final TransactionRepository transactionRepository;
    private final RabbitTemplate rabbitTemplate;

    private static final double ANOMALY_THRESHOLD = 3.0;
    private static final long MIN_HISTORY_COUNT = 3;

    public void checkAndPublish(Transaction newTransaction, String userEmail) {
        if (newTransaction.getType() != Transaction.TransactionType.EXPENSE) return;

        Long historyCount = transactionRepository.countByUserIdAndCategory(
                newTransaction.getUser().getId(),
                newTransaction.getCategory()
        );

        if (historyCount <= MIN_HISTORY_COUNT) {
            log.info("Not enough history for anomaly detection on category: {}", newTransaction.getCategory());
            return;
        }

        BigDecimal avgExpense = transactionRepository.avgExpenseByUserIdAndCategory(
                newTransaction.getUser().getId(),
                newTransaction.getCategory()
        );

        if (avgExpense.compareTo(BigDecimal.ZERO) == 0) return;

        double ratio = newTransaction.getAmount()
                .divide(avgExpense, 2, RoundingMode.HALF_UP)
                .doubleValue();

        if (ratio >= ANOMALY_THRESHOLD) {
            log.warn("🚨 Anomaly detected! {} spent ₹{} on {} ({}x above average ₹{})",
                    userEmail,
                    newTransaction.getAmount(),
                    newTransaction.getCategory(),
                    String.format("%.1f", ratio),
                    avgExpense.setScale(0, RoundingMode.HALF_UP)
            );

            Map<String, Object> message = new HashMap<>();
            message.put("userEmail", userEmail);
            message.put("category", newTransaction.getCategory());
            message.put("amount", newTransaction.getAmount().toString());
            message.put("average", avgExpense.setScale(0, RoundingMode.HALF_UP).toString());
            message.put("ratio", String.format("%.1f", ratio));
            message.put("description", newTransaction.getDescription());
            message.put("transactionId", newTransaction.getId());

            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.ANOMALY_EXCHANGE,
                    RabbitMQConfig.ANOMALY_ROUTING_KEY,
                    message
            );
        }
    }
}
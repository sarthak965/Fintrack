package com.fintrack.infrastructure.messaging;

import com.fintrack.config.RabbitMQConfig;
import com.fintrack.domain.model.Anomaly;
import com.fintrack.domain.model.User;
import com.fintrack.domain.repository.UserRepository;
import com.fintrack.infrastructure.ai.GroqService;
import com.fintrack.infrastructure.persistence.JpaAnomalyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class AnomalyAlertConsumer {

    private final GroqService groqService;
    private final JpaAnomalyRepository anomalyRepository;
    private final UserRepository userRepository;

    @RabbitListener(queues = RabbitMQConfig.ANOMALY_QUEUE)
    public void handleAnomalyAlert(Map<String, Object> message) {
        String userEmail = (String) message.get("userEmail");
        String category = (String) message.get("category");
        String amount = (String) message.get("amount");
        String average = (String) message.get("average");
        String ratio = (String) message.get("ratio");
        String description = (String) message.get("description");

        String prompt = String.format(
                "A financial anomaly was detected. Write a short, friendly 3-line alert message.\n\n" +
                        "Facts:\n" +
                        "- Category: %s\n" +
                        "- New transaction: ₹%s (%s)\n" +
                        "- User's historical average for %s: ₹%s\n" +
                        "- This transaction is %sx higher than normal\n\n" +
                        "Format your response exactly like this:\n" +
                        "⚠️ Unusual %s Spending Detected\n" +
                        "Your transaction of ₹%s is %sx higher than your average %s spend of ₹%s.\n" +
                        "Tip: [one specific actionable tip]",
                category, amount, description,
                category, average, ratio,
                category, amount, ratio, category, average
        );

        String explanation = groqService.generateContent(prompt);
        log.warn("🚨 ANOMALY: {}", explanation);
        userRepository.findByEmail(userEmail).ifPresent(user -> {
            Anomaly anomaly = Anomaly.builder()
                    .user(user)
                    .category(category)
                    .amount(amount)
                    .average(average)
                    .ratio(ratio)
                    .aiExplanation(explanation)
                    .isRead(false)
                    .build();
            anomalyRepository.save(anomaly);
            log.info("✅ Anomaly saved to DB for user: {}", userEmail);
        });
        log.warn("\n========== ANOMALY ALERT ==========");
        log.warn("User: {}", userEmail);
        log.warn("{}", explanation);
        log.warn("====================================\n");
    }
}
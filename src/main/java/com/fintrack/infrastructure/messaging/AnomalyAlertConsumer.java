package com.fintrack.infrastructure.messaging;

import com.fintrack.config.RabbitMQConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
@Slf4j
public class AnomalyAlertConsumer {

    @RabbitListener(queues = RabbitMQConfig.ANOMALY_QUEUE)
    public void handleAnomalyAlert(Map<String, Object> message) {
        log.warn("🚨 ANOMALY DETECTED for user: {} | Details: {}",
                message.get("userEmail"),
                message.get("details"));
        // TODO: Send email/push notification
    }
}g
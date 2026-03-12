package com.fintrack.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String ANOMALY_QUEUE = "anomaly.queue";
    public static final String ANOMALY_EXCHANGE = "anomaly.exchange";
    public static final String ANOMALY_ROUTING_KEY = "anomaly.routing.key";

    @Bean
    public Queue anomalyQueue() {
        return new Queue(ANOMALY_QUEUE, true); // true = durable, survives restart
    }

    @Bean
    public TopicExchange anomalyExchange() {
        return new TopicExchange(ANOMALY_EXCHANGE);
    }

    @Bean
    public Binding anomalyBinding(Queue anomalyQueue, TopicExchange anomalyExchange) {
        return BindingBuilder.bind(anomalyQueue).to(anomalyExchange).with(ANOMALY_ROUTING_KEY);
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }
}
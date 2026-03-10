package com.fintrack.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Allow React frontend
        configuration.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://localhost:5173"
        ));

        // Allow these HTTP methods
        configuration.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "DELETE", "OPTIONS"
        ));

        // Allow these headers
        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept"
        ));

        // Allow cookies and auth headers
        configuration.setAllowCredentials(true);

        // Apply to all endpoints
        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
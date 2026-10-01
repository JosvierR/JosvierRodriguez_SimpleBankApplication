package com.josvier.simplebank.security.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.List;

/**
 * Exact browser origins for a frontend hosted apart from the API.
 *
 * An empty list leaves local and Docker same-origin proxying unchanged.
 * Wildcards, including {@code *.vercel.app}, are ignored.
 */
@Configuration
public class CorsOriginConfiguration {

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${cors.allowed-origins:}") String allowedOrigins) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(exactOrigins(allowedOrigins));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(false);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    static List<String> exactOrigins(String allowedOrigins) {
        List<String> origins = new ArrayList<>();
        if (allowedOrigins == null || allowedOrigins.isBlank()) {
            return origins;
        }
        for (String origin : allowedOrigins.split(",")) {
            String trimmed = origin.trim();
            if (trimmed.isEmpty() || trimmed.contains("*")) {
                continue;
            }
            origins.add(trimmed);
        }
        return List.copyOf(origins);
    }
}

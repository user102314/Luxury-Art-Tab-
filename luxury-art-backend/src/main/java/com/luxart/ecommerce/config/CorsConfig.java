package com.luxart.ecommerce.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins(
                                "http://localhost:5173",
                                "http://localhost:5174",
                                "http://localhost:5175",
                                "http://localhost:8080",
                                "http://localhost:8081",
                                "http://localhost:8082",
                                "http://127.0.0.1:5173",
                                "http://127.0.0.1:5174",
                                "http://127.0.0.1:5175",
                                "http://127.0.0.1:8080",
                                "http://127.0.0.1:8081",
                                "http://127.0.0.1:8082"
                        )
                        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
                registry.addMapping("/uploads/**")
                        .allowedOrigins(
                                "http://localhost:5173",
                                "http://localhost:5174",
                                "http://localhost:5175",
                                "http://localhost:8080",
                                "http://localhost:8081",
                                "http://localhost:8082",
                                "http://127.0.0.1:5173",
                                "http://127.0.0.1:5174",
                                "http://127.0.0.1:5175",
                                "http://127.0.0.1:8080",
                                "http://127.0.0.1:8081",
                                "http://127.0.0.1:8082"
                        );
            }
        };
    }
}

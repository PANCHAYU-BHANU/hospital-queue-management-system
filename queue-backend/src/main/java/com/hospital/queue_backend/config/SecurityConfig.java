package com.hospital.queue_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. Cross-Origin සහ CSRF ලොක් එක දැනට ඩිසේබල් කරනවා
                .cors(cors -> cors.disable())
                .csrf(csrf -> csrf.disable())
                // 2. ඕනෑම කෙනෙක්ට ඕනෑම ලින්ක් එකකට (register/login) එන්න පර්මිෂන් දෙනවා
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll()
                );

        return http.build();
    }
}
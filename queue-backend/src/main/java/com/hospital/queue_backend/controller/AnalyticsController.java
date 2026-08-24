package com.hospital.queue_backend.controller;

import com.hospital.queue_backend.dto.response.AnalyticsResponseDTO;
import com.hospital.queue_backend.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/super-admin")
    public ResponseEntity<AnalyticsResponseDTO> getSuperAdminAnalytics(
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        AnalyticsResponseDTO stats = analyticsService.getAnalytics(startDate, endDate);
        return ResponseEntity.ok(stats);
    }
}

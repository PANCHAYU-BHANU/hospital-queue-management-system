package com.hospital.queue_backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospital.queue_backend.dto.response.AnalyticsResponseDTO;
import com.hospital.queue_backend.entity.MedicalRecord;
import com.hospital.queue_backend.entity.Queue;
import com.hospital.queue_backend.repository.MedicalRecordRepository;
import com.hospital.queue_backend.repository.QueueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final QueueRepository queueRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AnalyticsResponseDTO getAnalytics(LocalDateTime startDate, LocalDateTime endDate) {
        // Fetch data in range
        List<Queue> queues = queueRepository.findByCreatedAtBetween(startDate, endDate);
        List<MedicalRecord> records = medicalRecordRepository.findByCreatedAtBetween(startDate, endDate);

        long totalOpdVisits = queues.size();

        // Unique patients from queues (assuming we count unique patient IDs)
        long totalPatients = queues.stream()
                .map(q -> q.getPatient().getId())
                .distinct()
                .count();

        // 1. Process Medicines
        Map<String, Integer> medicineCounts = new HashMap<>();
        long totalMedicinesDispensed = 0;

        for (MedicalRecord record : records) {
            // 1. Process Pharmacy Medicines
            String pharmacyJson = record.getPharmacyMedicines();
            if (pharmacyJson != null && !pharmacyJson.isEmpty() && !pharmacyJson.equals("[]")) {
                try {
                    List<Map<String, Object>> meds = objectMapper.readValue(pharmacyJson, new TypeReference<List<Map<String, Object>>>() {});
                    for (Map<String, Object> med : meds) {
                        String name = (String) med.get("name");
                        if (name != null) {
                            int qty = 1;
                            if (med.containsKey("totalQuantity")) {
                                Object tq = med.get("totalQuantity");
                                if (tq instanceof Number) {
                                    qty = ((Number) tq).intValue();
                                } else if (tq instanceof String) {
                                    try { qty = Integer.parseInt((String) tq); } catch (Exception e) {}
                                }
                            } else {
                                // Fallback calculation if totalQuantity is missing
                                String freq = (String) med.get("frequency");
                                int days = extractInt(med.get("days"), 1);
                                qty = calculateQuantity(freq, days);
                            }
                            medicineCounts.put(name, medicineCounts.getOrDefault(name, 0) + qty);
                            totalMedicinesDispensed += qty;
                        }
                    }
                } catch (Exception e) {
                    try {
                        List<String> medNames = objectMapper.readValue(pharmacyJson, new TypeReference<List<String>>() {});
                        for (String name : medNames) {
                            medicineCounts.put(name, medicineCounts.getOrDefault(name, 0) + 1);
                            totalMedicinesDispensed += 1;
                        }
                    } catch (Exception ex) {}
                }
            }

            // 2. Process External Medicines
            String externalJson = record.getExternalMedicines();
            if (externalJson != null && !externalJson.isEmpty() && !externalJson.equals("[]")) {
                try {
                    List<Map<String, Object>> extMeds = objectMapper.readValue(externalJson, new TypeReference<List<Map<String, Object>>>() {});
                    for (Map<String, Object> med : extMeds) {
                        String name = (String) med.get("name");
                        if (name != null && !name.trim().isEmpty()) {
                            String freq = (String) med.get("frequency");
                            int days = extractInt(med.get("days"), 1);
                            int qty = calculateQuantity(freq, days);
                            medicineCounts.put(name, medicineCounts.getOrDefault(name, 0) + qty);
                            totalMedicinesDispensed += qty;
                        }
                    }
                } catch (Exception e) {
                    // Ignore parsing errors for old raw string formats if any
                }
            }
        }

        List<AnalyticsResponseDTO.MedicineStatDTO> topMedicines = medicineCounts.entrySet().stream()
                .map(e -> new AnalyticsResponseDTO.MedicineStatDTO(e.getKey(), e.getValue()))
                .sorted((a, b) -> Integer.compare(b.getQuantity(), a.getQuantity()))
                .limit(10)
                .collect(Collectors.toList());

        // 2. Process Daily Visits (Group by Date)
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        Map<String, Long> visitsByDate = queues.stream()
                .collect(Collectors.groupingBy(
                        q -> q.getCreatedAt().format(formatter),
                        Collectors.counting()
                ));

        // Sort by date key
        List<AnalyticsResponseDTO.DailyVisitStatDTO> dailyVisits = visitsByDate.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> new AnalyticsResponseDTO.DailyVisitStatDTO(e.getKey(), e.getValue()))
                .collect(Collectors.toList());

        // 3. Process Hospital Stats
        Map<String, Long> visitsByHospital = queues.stream()
                .filter(q -> q.getHospital() != null)
                .collect(Collectors.groupingBy(
                        q -> q.getHospital().getName(),
                        Collectors.counting()
                ));

        List<AnalyticsResponseDTO.HospitalStatDTO> hospitalStats = visitsByHospital.entrySet().stream()
                .map(e -> new AnalyticsResponseDTO.HospitalStatDTO(e.getKey(), e.getValue()))
                .sorted((a, b) -> Long.compare(b.getCount(), a.getCount()))
                .collect(Collectors.toList());

        return new AnalyticsResponseDTO(
                totalOpdVisits,
                totalPatients,
                totalMedicinesDispensed,
                topMedicines,
                dailyVisits,
                hospitalStats
        );
    }

    private int extractInt(Object value, int defaultValue) {
        if (value == null) return defaultValue;
        if (value instanceof Number) return ((Number) value).intValue();
        if (value instanceof String) {
            try { return Integer.parseInt((String) value); } catch (Exception e) {}
        }
        return defaultValue;
    }

    private int calculateQuantity(String frequency, int days) {
        int timesPerDay = 1;
        if (frequency != null) {
            switch (frequency) {
                case "6 Hourly": timesPerDay = 4; break;
                case "8 Hourly": timesPerDay = 3; break;
                case "12 Hourly": timesPerDay = 2; break;
                case "Morning Only":
                case "Night Only": timesPerDay = 1; break;
                case "Morning & Night": timesPerDay = 2; break;
                default: timesPerDay = 1;
            }
        }
        return timesPerDay * days;
    }
}

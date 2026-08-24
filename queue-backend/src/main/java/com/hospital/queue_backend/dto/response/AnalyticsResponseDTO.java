package com.hospital.queue_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsResponseDTO {
    private long totalOpdVisits;
    private long totalPatients;
    private long totalMedicinesDispensed;
    private List<MedicineStatDTO> topMedicines;
    private List<DailyVisitStatDTO> dailyVisits;
    private List<HospitalStatDTO> hospitalStats;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MedicineStatDTO {
        private String name;
        private int quantity;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyVisitStatDTO {
        private String date; // format: "YYYY-MM-DD"
        private long count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HospitalStatDTO {
        private String hospitalName;
        private long count;
    }
}

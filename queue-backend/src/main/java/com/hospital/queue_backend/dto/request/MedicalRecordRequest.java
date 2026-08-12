package com.hospital.queue_backend.dto.request;

import lombok.Data;

@Data
public class MedicalRecordRequest {
    private String nicNumber; // Patient's NIC
    private Long doctorId;
    private String diagnosis;
    private String pharmacyMedicines; // JSON array of selected medicines
    private String externalMedicines; // Handwritten external medicines
    private String notes;
}

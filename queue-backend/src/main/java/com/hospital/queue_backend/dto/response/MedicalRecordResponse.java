package com.hospital.queue_backend.dto.response;

import com.hospital.queue_backend.entity.MedicalRecord;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MedicalRecordResponse {
    private Long id;
    private String patientName;
    private String doctorName;
    private String hospitalName;
    private String diagnosis;
    private String pharmacyMedicines;
    private String externalMedicines;
    private String notes;
    private Integer patientAgeAtConsultation;
    private LocalDateTime createdAt;

    public MedicalRecordResponse(MedicalRecord record) {
        this.id = record.getId();
        this.patientName = record.getPatient() != null ? record.getPatient().getFullName() : null;
        this.doctorName = record.getDoctor() != null ? record.getDoctor().getDoctorName() : null;
        this.hospitalName = record.getHospital() != null ? record.getHospital().getName() : null;
        this.diagnosis = record.getDiagnosis();
        this.pharmacyMedicines = record.getPharmacyMedicines();
        this.externalMedicines = record.getExternalMedicines();
        this.notes = record.getNotes();
        this.patientAgeAtConsultation = record.getPatientAgeAtConsultation();
        this.createdAt = record.getCreatedAt();
    }
}

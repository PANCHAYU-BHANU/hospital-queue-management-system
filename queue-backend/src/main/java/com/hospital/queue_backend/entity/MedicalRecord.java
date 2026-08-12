package com.hospital.queue_backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "medical_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @ManyToOne
    @JoinColumn(name = "hospital_id")
    private Hospital hospital;

    @Column(nullable = false)
    private String diagnosis;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String pharmacyMedicines; // JSON array of selected pharmacy medicines

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String externalMedicines; // Handwritten external medicines

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String notes; // Doctor's remarks

    private Integer patientAgeAtConsultation;

    private java.time.LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = java.time.LocalDateTime.now();
    }
}

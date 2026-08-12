package com.hospital.queue_backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "doctors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user; // දොස්තරගේ Login එකට link වෙනවා

    @Column(nullable = false)
    private String doctorName;

    @Column(nullable = false)
    private String specialization; // OPD, Clinic, Pediatic වගේ

    @Column(nullable = false)
    private boolean isAvailable = true; // දොස්තර අද ඇවිත්ද නැද්ද කියලා

    @ManyToOne
    @JoinColumn(name = "hospital_id", referencedColumnName = "id")
    private Hospital hospital; // රෝහල
}

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

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user; // දොස්තරගේ Login එකට link වෙනවා

    @Column(nullable = false)
    private String doctorName;

    @Column(nullable = false)
    private String specialization; // OPD, Clinic, Pediatic වගේ

    private String roomNumber; // බලාගන්නා කාමර අංකය හෝ කවුන්ටරය

    private boolean isAvailable; // දැනට රෝගීන් බලනවාද නැද්ද (Active/Inactive)

    @ManyToOne
    @JoinColumn(name = "hospital_id", referencedColumnName = "id")
    private Hospital hospital; // රෝහල
}

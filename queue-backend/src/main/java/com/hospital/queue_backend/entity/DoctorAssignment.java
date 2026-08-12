package com.hospital.queue_backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "doctor_assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DoctorAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "doctor_id", referencedColumnName = "id", nullable = false)
    private Doctor doctor;

    @ManyToOne
    @JoinColumn(name = "opd_room_id", referencedColumnName = "id", nullable = false)
    private OpdRoom opdRoom;

    @Column(nullable = false)
    private String timePeriod; // e.g. "08:00 AM - 12:00 PM"

    @Column(nullable = false)
    private java.time.LocalDate assignedDate;
}

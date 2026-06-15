package com.hospital.queue_backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "hospital_admins")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HospitalAdmin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user; // Admin's login credentials

    @Column(nullable = false)
    private String fullName;

    @ManyToOne
    @JoinColumn(name = "hospital_id", referencedColumnName = "id", nullable = false)
    private Hospital hospital; // The hospital this admin manages
}

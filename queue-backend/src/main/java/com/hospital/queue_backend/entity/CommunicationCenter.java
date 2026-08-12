package com.hospital.queue_backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "communication_centers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CommunicationCenter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user; // Links to the User account for login

    @Column(nullable = false)
    private String centerName;

    @ManyToOne
    @JoinColumn(name = "hospital_id", referencedColumnName = "id")
    private Hospital hospital; // The hospital this center is authorized for
}

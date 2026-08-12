package com.hospital.queue_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "transfer_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TransferRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "doctor_user_id", referencedColumnName = "id", nullable = false)
    private User doctorUser;

    @ManyToOne
    @JoinColumn(name = "from_hospital_id", referencedColumnName = "id")
    private Hospital fromHospital; // Nullable if the doctor is new or being assigned without a current hospital

    @ManyToOne
    @JoinColumn(name = "to_hospital_id", referencedColumnName = "id", nullable = false)
    private Hospital toHospital;

    @ManyToOne
    @JoinColumn(name = "requested_by_admin_id", referencedColumnName = "id", nullable = false)
    private User requestedByAdmin;

    @Column(nullable = false)
    private String status; // PENDING, APPROVED, REJECTED

    private LocalDateTime requestedAt;
    
    @PrePersist
    protected void onCreate() {
        requestedAt = LocalDateTime.now();
    }
}

package com.hospital.queue_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "medicines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Medicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "hospital_id", referencedColumnName = "id", nullable = false)
    private Hospital hospital; // Which hospital's pharmacy this belongs to

    @Column(nullable = false)
    private String name; // e.g. Paracetamol 500mg

    @Column(nullable = false)
    private int availableQuantity; // Inventory count

    @Column(nullable = false)
    private String unit; // e.g. pills, bottles, ml, mg

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}

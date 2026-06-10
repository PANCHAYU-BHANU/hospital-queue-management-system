package com.hospital.queue_backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "queues")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Queue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id", referencedColumnName = "id", nullable = false)
    private Patient patient; // පෝලිමේ ඉන්න රෝගියා

    @ManyToOne
    @JoinColumn(name = "doctor_id", referencedColumnName = "id", nullable = false)
    private Doctor doctor; // රෝගියා පෙන්වන්න ඉන්න දොස්තර

    @Column(nullable = false)
    private int tokenNumber; // රෝගියාට ලැබුණු ටෝකන් අංකය

    @Column(nullable = false)
    private String status; // WAITING, IN_CONSULTATION, COMPLETED, LEFT, SKIPPED

    @Column(nullable = false)
    private String bookedVia; // MOBILE_APP හෝ HOSPITAL_COUNTER (phone නැති අය හඳුනාගන්න)

    @Column(name = "queue_type", nullable = false)
    private String queueType; // "NORMAL" හෝ "PRIORITY

    private java.time.LocalDateTime createdAt; // පෝලිමට එකතු වුණු වෙලාව

    @PrePersist
    protected void onCreate() {
        this.createdAt = java.time.LocalDateTime.now(); // Record එක හැදෙද්දිම Time එක auto වැටෙනවා
    }
}

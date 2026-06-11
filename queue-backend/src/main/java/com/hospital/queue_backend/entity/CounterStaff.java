package com.hospital.queue_backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "counter_staff")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CounterStaff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user; // කවුන්ටර් එකේ කෙනාගේ Login එකට link වෙනවා

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String counterNumber; // අදාළ කවුන්ටර් අංකය (උදා: Counter 1)
}

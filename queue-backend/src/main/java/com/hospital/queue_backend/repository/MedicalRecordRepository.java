package com.hospital.queue_backend.repository;

import com.hospital.queue_backend.entity.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {
    List<MedicalRecord> findByPatient_IdOrderByCreatedAtDesc(Long patientId);
    List<MedicalRecord> findByPatient_User_NicNumberOrderByCreatedAtDesc(String nicNumber);
    List<MedicalRecord> findByCreatedAtBetween(java.time.LocalDateTime startDate, java.time.LocalDateTime endDate);
}

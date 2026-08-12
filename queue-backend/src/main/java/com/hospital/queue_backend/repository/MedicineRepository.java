package com.hospital.queue_backend.repository;

import com.hospital.queue_backend.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    List<Medicine> findByHospitalId(Long hospitalId);
    List<Medicine> findByHospitalIdOrderByNameAsc(Long hospitalId);
}

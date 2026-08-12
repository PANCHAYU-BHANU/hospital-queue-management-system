package com.hospital.queue_backend.repository;

import com.hospital.queue_backend.entity.Pharmacist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PharmacistRepository extends JpaRepository<Pharmacist, Long> {
    List<Pharmacist> findByHospitalId(Long hospitalId);
    Optional<Pharmacist> findByUserId(Long userId);
}

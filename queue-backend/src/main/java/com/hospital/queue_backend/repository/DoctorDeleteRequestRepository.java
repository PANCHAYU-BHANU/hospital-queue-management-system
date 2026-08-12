package com.hospital.queue_backend.repository;

import com.hospital.queue_backend.entity.DoctorDeleteRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoctorDeleteRequestRepository extends JpaRepository<DoctorDeleteRequest, Long> {
    List<DoctorDeleteRequest> findAllByOrderByRequestedAtDesc();
}

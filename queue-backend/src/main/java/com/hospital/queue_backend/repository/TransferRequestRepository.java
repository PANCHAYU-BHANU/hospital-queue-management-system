package com.hospital.queue_backend.repository;

import com.hospital.queue_backend.entity.TransferRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransferRequestRepository extends JpaRepository<TransferRequest, Long> {
    List<TransferRequest> findByStatus(String status);
    List<TransferRequest> findByRequestedByAdminId(Long adminId);
    List<TransferRequest> findByToHospitalId(Long hospitalId);
}

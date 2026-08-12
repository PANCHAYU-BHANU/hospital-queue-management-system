package com.hospital.queue_backend.repository;

import com.hospital.queue_backend.entity.DoctorAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoctorAssignmentRepository extends JpaRepository<DoctorAssignment, Long> {
    List<DoctorAssignment> findByOpdRoom_Id(Long opdRoomId);
    List<DoctorAssignment> findByDoctor_Id(Long doctorId);
    
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Modifying
    void deleteByAssignedDateBefore(java.time.LocalDate date);
}

package com.hospital.queue_backend.repository;

import com.hospital.queue_backend.entity.CommunicationCenter;
import com.hospital.queue_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface CommunicationCenterRepository extends JpaRepository<CommunicationCenter, Long> {
    Optional<CommunicationCenter> findByUser(User user);
    List<CommunicationCenter> findByHospitalId(Long hospitalId);
}

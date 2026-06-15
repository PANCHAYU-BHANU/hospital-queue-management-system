package com.hospital.queue_backend.repository;

import com.hospital.queue_backend.entity.HospitalAdmin;
import com.hospital.queue_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HospitalAdminRepository extends JpaRepository<HospitalAdmin, Long> {
    Optional<HospitalAdmin> findByUser(User user);
}

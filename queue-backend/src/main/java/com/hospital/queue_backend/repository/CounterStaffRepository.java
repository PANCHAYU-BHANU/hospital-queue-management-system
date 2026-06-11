package com.hospital.queue_backend.repository;

import com.hospital.queue_backend.entity.CounterStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CounterStaffRepository extends JpaRepository<CounterStaff, Long> {
    boolean existsByCounterNumber(String counterNumber);
}

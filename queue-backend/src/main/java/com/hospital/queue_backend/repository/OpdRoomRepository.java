package com.hospital.queue_backend.repository;

import com.hospital.queue_backend.entity.OpdRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OpdRoomRepository extends JpaRepository<OpdRoom, Long> {
    List<OpdRoom> findByHospital_Id(Long hospitalId);
}

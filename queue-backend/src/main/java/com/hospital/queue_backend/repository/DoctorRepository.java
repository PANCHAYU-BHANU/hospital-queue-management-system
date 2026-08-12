package com.hospital.queue_backend.repository;

import com.hospital.queue_backend.entity.Doctor;
import com.hospital.queue_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long>{
    // User එකවුන්ට් එක මඟින් දොස්තරගේ ප්‍රොෆයිල් හොයාගන්න
    List<Doctor> findByUser(User user);

    List<Doctor> findByUser_Id(Long userId);

    List<Doctor> findByHospital_Id(Long hospitalId);
}

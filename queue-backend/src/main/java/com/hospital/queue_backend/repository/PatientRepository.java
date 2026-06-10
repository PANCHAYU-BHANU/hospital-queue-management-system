package com.hospital.queue_backend.repository;

import com.hospital.queue_backend.entity.Patient;
import com.hospital.queue_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    // User එකවුන්ට් එක මඟින් රෝගියාගේ ප්‍රොෆයිල් එක හොයාගන්න
    Optional<Patient> findByUser(User user);
}

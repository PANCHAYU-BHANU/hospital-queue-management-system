package com.hospital.queue_backend.repository;

import com.hospital.queue_backend.entity.Doctor;
import com.hospital.queue_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long>{
    // User එකවුන්ට් එක මඟින් දොස්තරගේ ප්‍රොෆයිල් එක හොයාගන්න
    Optional<Doctor> findByUser(User user);

    // දැනටමත් ඒ කාමර අංකයෙන් (Counter) වෙනත් දොස්තර කෙනෙක් ඉන්නවාද බලන්න
    boolean existsByRoomNumber(String roomNumber);
}

package com.hospital.queue_backend.repository;

import com.hospital.queue_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>{

    // NIC අංකයෙන් User කෙනෙක්ව හොයාගන්න (Login වලට ඕන වෙනවා)
    Optional<User> findByNicNumber(String nicNumber);

    // Phone නම්බර් එකෙන් දැනටමත් එකවුන්ට් එකක් තියෙනවාද බලන්න
    boolean existsByPhoneNumber(String phoneNumber);

    // NIC එකෙන් දැනටමත් එකවුන්ට් එකක් තියෙනවාද බලන්න
    boolean existsByNicNumber(String nicNumber);
}

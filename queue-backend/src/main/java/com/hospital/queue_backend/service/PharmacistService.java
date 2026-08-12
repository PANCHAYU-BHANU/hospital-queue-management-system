package com.hospital.queue_backend.service;

import com.hospital.queue_backend.entity.Hospital;
import com.hospital.queue_backend.entity.Pharmacist;
import com.hospital.queue_backend.entity.User;
import com.hospital.queue_backend.repository.HospitalRepository;
import com.hospital.queue_backend.repository.PharmacistRepository;
import com.hospital.queue_backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PharmacistService {

    private final PharmacistRepository pharmacistRepository;
    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;

    public PharmacistService(PharmacistRepository pharmacistRepository, UserRepository userRepository, HospitalRepository hospitalRepository) {
        this.pharmacistRepository = pharmacistRepository;
        this.userRepository = userRepository;
        this.hospitalRepository = hospitalRepository;
    }

    public Pharmacist registerPharmacist(String nic, String phone, String password, String fullName, Long hospitalId) {
        // Create User
        User user = new User();
        user.setNicNumber(nic);
        user.setPhoneNumber(phone);
        user.setPassword(password); // Note: In production this should be hashed
        user.setRole("ROLE_PHARMACIST");
        user = userRepository.save(user);

        // Fetch Hospital
        Hospital hospital = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new RuntimeException("Hospital not found"));

        // Create Pharmacist
        Pharmacist pharmacist = new Pharmacist();
        pharmacist.setUser(user);
        pharmacist.setFullName(fullName);
        pharmacist.setHospital(hospital);
        
        return pharmacistRepository.save(pharmacist);
    }

    public List<Pharmacist> getPharmacistsByHospital(Long hospitalId) {
        return pharmacistRepository.findByHospitalId(hospitalId);
    }
    
    public Optional<Pharmacist> getPharmacistByUserId(Long userId) {
        return pharmacistRepository.findByUserId(userId);
    }
}

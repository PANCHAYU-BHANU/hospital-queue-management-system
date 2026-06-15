package com.hospital.queue_backend.service;

import com.hospital.queue_backend.dto.request.HospitalAdminRegistrationRequest;
import com.hospital.queue_backend.entity.Hospital;
import com.hospital.queue_backend.entity.HospitalAdmin;
import com.hospital.queue_backend.entity.User;
import com.hospital.queue_backend.repository.HospitalAdminRepository;
import com.hospital.queue_backend.repository.HospitalRepository;
import com.hospital.queue_backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SuperAdminService {

    private final UserRepository userRepository;
    private final HospitalAdminRepository hospitalAdminRepository;
    private final HospitalRepository hospitalRepository;

    public SuperAdminService(UserRepository userRepository, HospitalAdminRepository hospitalAdminRepository, HospitalRepository hospitalRepository) {
        this.userRepository = userRepository;
        this.hospitalAdminRepository = hospitalAdminRepository;
        this.hospitalRepository = hospitalRepository;
    }

    @Transactional
    public String registerHospitalAdmin(HospitalAdminRegistrationRequest request) {
        if (userRepository.existsByNicNumber(request.getNicNumber())) {
            return "Error: NIC Number is already registered!";
        }
        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            return "Error: Phone Number is already registered!";
        }

        Hospital hospital = hospitalRepository.findById(request.getHospitalId())
                .orElseThrow(() -> new RuntimeException("Error: Hospital not found!"));

        User user = new User();
        user.setNicNumber(request.getNicNumber());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setPassword(request.getPassword());
        user.setRole("ROLE_ADMIN"); // Normal admin for the hospital
        User savedUser = userRepository.save(user);

        HospitalAdmin admin = new HospitalAdmin();
        admin.setUser(savedUser);
        admin.setFullName(request.getFullName());
        admin.setHospital(hospital);
        hospitalAdminRepository.save(admin);

        return "Hospital Admin Registered Successfully!";
    }

    @Transactional
    public String deleteHospitalAdmin(Long id) {
        HospitalAdmin admin = hospitalAdminRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: Hospital Admin not found!"));
        User user = admin.getUser();
        hospitalAdminRepository.delete(admin);
        userRepository.delete(user);
        return "Hospital Admin deleted successfully!";
    }

    @Transactional
    public String updateHospitalAdmin(Long id, HospitalAdminRegistrationRequest request) {
        HospitalAdmin admin = hospitalAdminRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: Hospital Admin not found!"));
        
        User user = admin.getUser();
        if (request.getNicNumber() != null && !request.getNicNumber().equals(user.getNicNumber())) {
             if (userRepository.existsByNicNumber(request.getNicNumber())) return "Error: NIC already in use!";
             user.setNicNumber(request.getNicNumber());
        }
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().equals(user.getPhoneNumber())) {
             if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) return "Error: Phone already in use!";
             user.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
             user.setPassword(request.getPassword());
        }
        
        if (request.getFullName() != null) admin.setFullName(request.getFullName());
        if (request.getHospitalId() != null) {
            Hospital hospital = hospitalRepository.findById(request.getHospitalId())
                .orElseThrow(() -> new RuntimeException("Error: Hospital not found!"));
            admin.setHospital(hospital);
        }
        
        userRepository.save(user);
        hospitalAdminRepository.save(admin);
        return "Hospital Admin updated successfully!";
    }

    public java.util.List<HospitalAdmin> getAllAdmins() {
        return hospitalAdminRepository.findAll();
    }
}

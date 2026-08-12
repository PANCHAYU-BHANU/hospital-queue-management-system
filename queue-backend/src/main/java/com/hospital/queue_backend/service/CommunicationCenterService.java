package com.hospital.queue_backend.service;

import com.hospital.queue_backend.dto.request.CommunicationRegistrationRequest;
import com.hospital.queue_backend.entity.CommunicationCenter;
import com.hospital.queue_backend.entity.Hospital;
import com.hospital.queue_backend.entity.User;
import com.hospital.queue_backend.repository.CommunicationCenterRepository;
import com.hospital.queue_backend.repository.HospitalRepository;
import com.hospital.queue_backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CommunicationCenterService {

    private final UserRepository userRepository;
    private final CommunicationCenterRepository communicationCenterRepository;
    private final HospitalRepository hospitalRepository;

    public CommunicationCenterService(UserRepository userRepository, CommunicationCenterRepository communicationCenterRepository, HospitalRepository hospitalRepository) {
        this.userRepository = userRepository;
        this.communicationCenterRepository = communicationCenterRepository;
        this.hospitalRepository = hospitalRepository;
    }

    @Transactional
    public String registerCommunicationCenter(CommunicationRegistrationRequest request) {
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
        user.setRole("ROLE_COMMUNICATION");
        User savedUser = userRepository.save(user);

        CommunicationCenter center = new CommunicationCenter();
        center.setUser(savedUser);
        center.setCenterName(request.getCenterName());
        center.setHospital(hospital);
        communicationCenterRepository.save(center);

        return "Communication Center Registered Successfully!";
    }

    public List<CommunicationCenter> getCentersByHospital(Long hospitalId) {
        return communicationCenterRepository.findByHospitalId(hospitalId);
    }
    
    @Transactional
    public String deleteCommunicationCenter(Long id) {
        CommunicationCenter center = communicationCenterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: Communication Center not found!"));
        User user = center.getUser();
        communicationCenterRepository.delete(center);
        userRepository.delete(user);
        return "Communication Center deleted successfully!";
    }
}

package com.hospital.queue_backend.service;

import com.hospital.queue_backend.dto.request.PatientProfileUpdateRequest;
import com.hospital.queue_backend.dto.response.PatientProfileDTO;
import com.hospital.queue_backend.entity.Patient;
import com.hospital.queue_backend.entity.User;
import com.hospital.queue_backend.repository.PatientRepository;
import com.hospital.queue_backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    public PatientService(PatientRepository patientRepository, UserRepository userRepository) {
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
    }

    public PatientProfileDTO getPatientProfile(Long userId) {
        Patient patient = patientRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Patient profile not found for user id: " + userId));

        User user = patient.getUser();

        PatientProfileDTO dto = new PatientProfileDTO();
        dto.setUserId(user.getId());
        dto.setFullName(patient.getFullName());
        dto.setNicNumber(user.getNicNumber());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setAge(patient.getAge());
        dto.setGender(patient.getGender());
        dto.setProfilePictureBase64(patient.getProfilePictureBase64());
        dto.setHomeAddress(patient.getHomeAddress());
        dto.setAlternateAddress(patient.getAlternateAddress());
        dto.setBloodGroup(patient.getBloodGroup());
        dto.setEmergencyContact(patient.getEmergencyContact());

        return dto;
    }

    @Transactional
    public String updatePatientProfile(Long userId, PatientProfileUpdateRequest request) {
        Patient patient = patientRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Patient profile not found for user id: " + userId));

        User user = patient.getUser();

        // Update Patient fields
        if (request.getFullName() != null && !request.getFullName().isEmpty()) {
            patient.setFullName(request.getFullName());
        }
        patient.setProfilePictureBase64(request.getProfilePictureBase64());
        patient.setHomeAddress(request.getHomeAddress());
        patient.setAlternateAddress(request.getAlternateAddress());
        patient.setBloodGroup(request.getBloodGroup());
        patient.setEmergencyContact(request.getEmergencyContact());
        
        patientRepository.save(patient);

        // Update User fields (phoneNumber)
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isEmpty()) {
            user.setPhoneNumber(request.getPhoneNumber());
            userRepository.save(user);
        }

        return "Profile updated successfully!";
    }
}

package com.hospital.queue_backend.service;

import com.hospital.queue_backend.entity.Doctor;
import com.hospital.queue_backend.entity.User;
import com.hospital.queue_backend.repository.DoctorRepository;
import com.hospital.queue_backend.repository.UserRepository;
import com.hospital.queue_backend.dto.request.DoctorRegistrationRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hospital.queue_backend.entity.Hospital;
import com.hospital.queue_backend.repository.HospitalRepository;

@Service
public class DoctorService {
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final HospitalRepository hospitalRepository;

    public DoctorService(UserRepository userRepository, DoctorRepository doctorRepository, HospitalRepository hospitalRepository) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.hospitalRepository = hospitalRepository;
    }

    @Transactional
    public String registerDoctor(DoctorRegistrationRequest request) {

        // 1. NIC හෝ Phone එකෙන් දැනටමත් කෙනෙක් ඉන්නවාද බලනවා
        if (userRepository.existsByNicNumber(request.getNicNumber())) {
            return "Error: NIC Number is already registered!";
        }
        if (doctorRepository.existsByRoomNumber(request.getRoomNumber())) {
            return "Error: Room/Counter Number is already assigned to another doctor!";
        }

        Hospital hospital = hospitalRepository.findById(request.getHospitalId())
                .orElseThrow(() -> new RuntimeException("Error: Hospital not found!"));

        // 2. Doctor කෙනාටත් Login එකවුන්ට් (User) එකක් හදනවා
        User user = new User();
        user.setNicNumber(request.getNicNumber());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setPassword(request.getPassword());
        user.setRole("ROLE_DOCTOR"); // Role එක DOCTOR විදියට දානවා
        User savedUser = userRepository.save(user);

        // 3. Doctor Profile එක ලින්ක් කරලා සේව් කරනවා
        Doctor doctor = new Doctor();
        doctor.setUser(savedUser);
        doctor.setDoctorName(request.getDoctorName());
        doctor.setSpecialization(request.getSpecialization());
        doctor.setRoomNumber(request.getRoomNumber());
        doctor.setHospital(hospital);
        if (request.getIsAvailable() != null) {
            doctor.setAvailable(request.getIsAvailable());
        } else {
            doctor.setAvailable(true);
        }
        doctorRepository.save(doctor);

        return "Doctor Registered Successfully!";
    }

    @Transactional
    public String deleteDoctor(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: Doctor not found!"));
        User user = doctor.getUser();
        doctorRepository.delete(doctor);
        userRepository.delete(user);
        return "Doctor deleted successfully!";
    }

    @Transactional
    public String updateDoctor(Long id, DoctorRegistrationRequest request) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: Doctor not found!"));
        
        User user = doctor.getUser();
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
        
        if (request.getDoctorName() != null) doctor.setDoctorName(request.getDoctorName());
        if (request.getSpecialization() != null) doctor.setSpecialization(request.getSpecialization());
        if (request.getRoomNumber() != null) doctor.setRoomNumber(request.getRoomNumber());
        if (request.getIsAvailable() != null) doctor.setAvailable(request.getIsAvailable());
        
        userRepository.save(user);
        doctorRepository.save(doctor);
        return "Doctor updated successfully!";
    }

    public java.util.List<com.hospital.queue_backend.dto.response.DoctorResponse> getAllDoctors() {
        return doctorRepository.findAll().stream()
                .map(doctor -> new com.hospital.queue_backend.dto.response.DoctorResponse(
                        doctor.getId(),
                        doctor.getDoctorName(),
                        doctor.getSpecialization(),
                        doctor.getRoomNumber(),
                        doctor.isAvailable(),
                        doctor.getUser().getNicNumber(),
                        doctor.getUser().getPhoneNumber()
                ))
                .collect(java.util.stream.Collectors.toList());
    }
}

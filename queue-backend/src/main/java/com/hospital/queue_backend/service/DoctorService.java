package com.hospital.queue_backend.service;

import com.hospital.queue_backend.entity.Doctor;
import com.hospital.queue_backend.entity.User;
import com.hospital.queue_backend.repository.DoctorRepository;
import com.hospital.queue_backend.repository.UserRepository;
import com.hospital.queue_backend.dto.request.DoctorRegistrationRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DoctorService {
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;

    public DoctorService(UserRepository userRepository, DoctorRepository doctorRepository) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
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
        doctorRepository.save(doctor);

        return "Doctor Registered Successfully!";
    }
}

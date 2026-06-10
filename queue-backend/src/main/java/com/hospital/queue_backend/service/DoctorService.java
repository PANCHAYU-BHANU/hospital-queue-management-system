package com.hospital.queue_backend.service;

import com.hospital.queue_backend.entity.Doctor;
import com.hospital.queue_backend.entity.User;
import com.hospital.queue_backend.repository.DoctorRepository;
import com.hospital.queue_backend.repository.UserRepository;
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
    public String registerDoctor(String nic, String phone, String password, String doctorName, String specialization, String roomNumber) {

        // 1. NIC හෝ Phone එකෙන් දැනටමත් කෙනෙක් ඉන්නවාද බලනවා
        if (userRepository.existsByNicNumber(nic)) {
            return "Error: NIC Number is already registered!";
        }
        if (doctorRepository.existsByRoomNumber(roomNumber)) {
            return "Error: Room/Counter Number is already assigned to another doctor!";
        }

        // 2. Doctor කෙනාටත් Login එකවුන්ට් (User) එකක් හදනවා
        User user = new User();
        user.setNicNumber(nic);
        user.setPhoneNumber(phone);
        user.setPassword(password);
        user.setRole("ROLE_DOCTOR"); // Role එක DOCTOR විදියට දානවා
        User savedUser = userRepository.save(user);

        // 3. Doctor Profile එක ලින්ක් කරලා සේව් කරනවා
        Doctor doctor = new Doctor();
        doctor.setUser(savedUser);
        doctor.setDoctorName(doctorName);
        doctor.setSpecialization(specialization);
        doctor.setRoomNumber(roomNumber);
        doctorRepository.save(doctor);

        return "Doctor Registered Successfully!";
    }
}

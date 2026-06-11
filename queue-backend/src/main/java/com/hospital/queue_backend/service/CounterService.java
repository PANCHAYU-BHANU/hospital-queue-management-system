package com.hospital.queue_backend.service;

import com.hospital.queue_backend.dto.request.CounterRegistrationRequest;
import com.hospital.queue_backend.entity.CounterStaff;
import com.hospital.queue_backend.entity.User;
import com.hospital.queue_backend.repository.CounterStaffRepository;
import com.hospital.queue_backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CounterService {

    private final UserRepository userRepository;
    private final CounterStaffRepository counterStaffRepository;

    public CounterService(UserRepository userRepository, CounterStaffRepository counterStaffRepository) {
        this.userRepository = userRepository;
        this.counterStaffRepository = counterStaffRepository;
    }

    @Transactional
    public String registerCounter(CounterRegistrationRequest request) {

        // 1. NIC හෝ Phone එකෙන් දැනටමත් කෙනෙක් ඉන්නවාද බලනවා
        if (userRepository.existsByNicNumber(request.getNicNumber())) {
            return "Error: NIC Number is already registered!";
        }
        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            return "Error: Phone Number is already registered!";
        }
        if (counterStaffRepository.existsByCounterNumber(request.getCounterNumber())) {
            return "Error: Counter Number is already assigned to another staff member!";
        }

        // 2. Counter Staff ටත් Login එකවුන්ට් (User) එකක් හදනවා
        User user = new User();
        user.setNicNumber(request.getNicNumber());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setPassword(request.getPassword());
        user.setRole("ROLE_COUNTER"); // Role එක COUNTER විදියට දානවා
        User savedUser = userRepository.save(user);

        // 3. Counter Staff Profile එක ලින්ක් කරලා සේව් කරනවා
        CounterStaff counterStaff = new CounterStaff();
        counterStaff.setUser(savedUser);
        counterStaff.setFullName(request.getFullName());
        counterStaff.setCounterNumber(request.getCounterNumber());
        counterStaffRepository.save(counterStaff);

        return "Counter Staff Registered Successfully!";
    }
}

package com.hospital.queue_backend.service;

import com.hospital.queue_backend.dto.request.CounterRegistrationRequest;
import com.hospital.queue_backend.entity.CounterStaff;
import com.hospital.queue_backend.entity.User;
import com.hospital.queue_backend.repository.CounterStaffRepository;
import com.hospital.queue_backend.repository.UserRepository;
import com.hospital.queue_backend.repository.HospitalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CounterService {

    private final UserRepository userRepository;
    private final CounterStaffRepository counterStaffRepository;
    private final HospitalRepository hospitalRepository;

    public CounterService(UserRepository userRepository, CounterStaffRepository counterStaffRepository, HospitalRepository hospitalRepository) {
        this.userRepository = userRepository;
        this.counterStaffRepository = counterStaffRepository;
        this.hospitalRepository = hospitalRepository;
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
        if (request.getHospitalId() != null) {
            hospitalRepository.findById(request.getHospitalId()).ifPresent(counterStaff::setHospital);
        }
        counterStaffRepository.save(counterStaff);

        return "Counter Staff Registered Successfully!";
    }

    @Transactional
    public String deleteCounter(Long id) {
        CounterStaff counter = counterStaffRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: Counter Staff not found!"));
        User user = counter.getUser();
        counterStaffRepository.delete(counter);
        userRepository.delete(user);
        return "Counter Staff deleted successfully!";
    }

    @Transactional
    public String updateCounter(Long id, CounterRegistrationRequest request) {
        CounterStaff counter = counterStaffRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: Counter Staff not found!"));
        
        User user = counter.getUser();
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
        
        if (request.getFullName() != null) counter.setFullName(request.getFullName());
        if (request.getCounterNumber() != null) counter.setCounterNumber(request.getCounterNumber());
        
        userRepository.save(user);
        counterStaffRepository.save(counter);
        return "Counter Staff updated successfully!";
    }

    public java.util.List<CounterStaff> getAllCounters() {
        return counterStaffRepository.findAll();
    }
}

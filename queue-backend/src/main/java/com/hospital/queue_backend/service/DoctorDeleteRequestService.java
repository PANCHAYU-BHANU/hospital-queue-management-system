package com.hospital.queue_backend.service;

import com.hospital.queue_backend.entity.Doctor;
import com.hospital.queue_backend.entity.DoctorDeleteRequest;
import com.hospital.queue_backend.entity.User;
import com.hospital.queue_backend.repository.DoctorDeleteRequestRepository;
import com.hospital.queue_backend.repository.DoctorRepository;
import com.hospital.queue_backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DoctorDeleteRequestService {

    private final DoctorDeleteRequestRepository requestRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final DoctorService doctorService;

    public DoctorDeleteRequestService(DoctorDeleteRequestRepository requestRepository,
                                      DoctorRepository doctorRepository,
                                      UserRepository userRepository,
                                      DoctorService doctorService) {
        this.requestRepository = requestRepository;
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
        this.doctorService = doctorService;
    }

    public String createDeleteRequest(Long adminUserId, Long doctorId, String reason) {
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Error: Admin User not found!"));

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Error: Doctor not found!"));

        DoctorDeleteRequest request = new DoctorDeleteRequest();
        request.setRequestedByAdmin(admin);
        request.setDoctor(doctor);
        request.setReason(reason);
        request.setRequestedAt(LocalDateTime.now());

        requestRepository.save(request);
        return "Success: Delete request submitted to Super Admin.";
    }

    public List<DoctorDeleteRequest> getPendingRequests() {
        return requestRepository.findAllByOrderByRequestedAtDesc();
    }

    @Transactional
    public String handleRequest(Long requestId, boolean isApproved) {
        DoctorDeleteRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Error: Request not found!"));

        if (isApproved) {
            String result = doctorService.deleteDoctor(request.getDoctor().getId());
            requestRepository.delete(request);
            return result;
        } else {
            requestRepository.delete(request);
            return "Success: Request rejected and removed.";
        }
    }
}

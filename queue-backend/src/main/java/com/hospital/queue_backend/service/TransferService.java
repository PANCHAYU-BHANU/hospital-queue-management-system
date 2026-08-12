package com.hospital.queue_backend.service;

import com.hospital.queue_backend.entity.Doctor;
import com.hospital.queue_backend.entity.Hospital;
import com.hospital.queue_backend.entity.TransferRequest;
import com.hospital.queue_backend.entity.User;
import com.hospital.queue_backend.repository.DoctorRepository;
import com.hospital.queue_backend.repository.HospitalRepository;
import com.hospital.queue_backend.repository.TransferRequestRepository;
import com.hospital.queue_backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TransferService {

    private final TransferRequestRepository transferRequestRepository;
    private final DoctorRepository doctorRepository;
    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;

    public TransferService(TransferRequestRepository transferRequestRepository,
                           DoctorRepository doctorRepository,
                           HospitalRepository hospitalRepository,
                           UserRepository userRepository) {
        this.transferRequestRepository = transferRequestRepository;
        this.doctorRepository = doctorRepository;
        this.hospitalRepository = hospitalRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public String requestTransfer(Long adminUserId, Long doctorId, Long targetHospitalId) {
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        Hospital targetHospital = hospitalRepository.findById(targetHospitalId)
                .orElseThrow(() -> new RuntimeException("Target Hospital not found"));

        TransferRequest req = new TransferRequest();
        req.setDoctorUser(doctor.getUser());
        req.setFromHospital(doctor.getHospital());
        req.setToHospital(targetHospital);
        req.setRequestedByAdmin(admin);
        req.setStatus("PENDING");
        
        transferRequestRepository.save(req);
        return "Transfer request sent to Super Admin!";
    }

    public List<TransferRequest> getPendingTransfers() {
        return transferRequestRepository.findByStatus("PENDING");
    }

    @Transactional
    public String handleTransferRequest(Long requestId, boolean isApproved) {
        TransferRequest req = transferRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        if (isApproved) {
            req.setStatus("APPROVED");
            // Update the doctor's primary hospital
            // Note: If the doctor exists in multiple, we need to handle that, but for now we just change the hospital of the first profile found.
            List<Doctor> docs = doctorRepository.findByUser(req.getDoctorUser());
            for (Doctor doc : docs) {
                if (doc.getHospital() != null && doc.getHospital().getId().equals(req.getFromHospital().getId())) {
                    doc.setHospital(req.getToHospital());
                    doctorRepository.save(doc);
                    break;
                }
            }
        } else {
            req.setStatus("REJECTED");
        }
        
        transferRequestRepository.save(req);
        return isApproved ? "Transfer Approved!" : "Transfer Rejected!";
    }
}

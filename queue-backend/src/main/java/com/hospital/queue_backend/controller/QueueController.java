package com.hospital.queue_backend.controller;

import com.hospital.queue_backend.dto.request.QueueGenerateRequest;
import com.hospital.queue_backend.dto.response.QueueResponse;
import com.hospital.queue_backend.service.QueueService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/queue")
@CrossOrigin(origins = "http://localhost:5173")
public class QueueController {

    private final QueueService queueService;

    public QueueController(QueueService queueService) {
        this.queueService = queueService;
    }

    // ටෝකන් එකක් ගන්න ලින්ක් එක (දැන් specialNeed එකත් json එකෙන් එවන්න ඕනේ)
    @PostMapping("/generate")
    public String generateToken(@RequestBody QueueGenerateRequest request) {
        return queueService.generateToken(request);
    }

    // දොස්තර "Next Patient" බටන් එක ඔබද්දී කතා කරන ලින්ක් එක (2:1 Ratio එකට වැඩ කරන්නේ මේකයි)
    @GetMapping("/next/{doctorId}")
    public QueueResponse getNextPatient(@PathVariable Long doctorId) {
        return queueService.getNextPatientForDoctor(doctorId);
    }

    @GetMapping("/doctor/{doctorId}")
    public List<QueueResponse> getDoctorQueue(@PathVariable Long doctorId) {
        return queueService.getTodayQueue(doctorId);
    }

    @PutMapping("/approve/{queueId}")
    public String approveToken(@PathVariable Long queueId) {
        return queueService.approvePatientToken(queueId);
    }

    @GetMapping("/pending-approvals")
    public List<QueueResponse> getPendingApprovals() {
        return queueService.getPendingApprovals();
    }
}
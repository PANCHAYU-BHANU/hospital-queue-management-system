package com.hospital.queue_backend.controller;

import com.hospital.queue_backend.dto.request.QueueGenerateRequest;
import com.hospital.queue_backend.dto.response.QueueResponse;
import com.hospital.queue_backend.service.QueueService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/queue")
@CrossOrigin(origins = "*")
public class QueueController {

    private final QueueService queueService;

    public QueueController(QueueService queueService) {
        this.queueService = queueService;
    }

    // ටෝකන් එකක් ගන්න ලින්ක් එක (දැන් specialNeed එකත් json එකෙන් එවන්න ඕනේ)
    @PostMapping("/generate")
    public org.springframework.http.ResponseEntity<?> generateToken(@RequestBody QueueGenerateRequest request) {
        try {
            return org.springframework.http.ResponseEntity.ok(queueService.generateToken(request));
        } catch (RuntimeException e) {
            return org.springframework.http.ResponseEntity.badRequest().body(e.getMessage());
        }
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

    @PutMapping("/start/{queueId}")
    public String startConsultation(@PathVariable Long queueId) {
        return queueService.startConsultation(queueId);
    }

    @PutMapping("/complete/{queueId}")
    public String completeConsultation(@PathVariable Long queueId) {
        return queueService.completeConsultation(queueId);
    }

    @PutMapping("/approve/{queueId}")
    public String approveToken(@PathVariable Long queueId) {
        return queueService.approvePatientToken(queueId);
    }

    @PutMapping("/reject/{queueId}")
    public String rejectToken(@PathVariable Long queueId) {
        return queueService.rejectPatientToken(queueId);
    }

    @GetMapping("/pending-approvals")
    public List<QueueResponse> getPendingApprovals() {
        return queueService.getPendingApprovals();
    }

    @PutMapping("/leave/{queueId}")
    public String leaveQueue(@PathVariable Long queueId) {
        return queueService.leaveQueue(queueId);
    }

    @GetMapping("/estimate-wait-time/{doctorId}")
    public String getEstimatedWaitTime(@PathVariable Long doctorId) {
        return queueService.getEstimatedWaitTime(doctorId);
    }

    @PostMapping("/offline-generate")
    public String generateOfflineToken(@RequestBody com.hospital.queue_backend.dto.request.OfflineQueueRequest request) {
        return queueService.generateOfflineToken(request);
    }

    @GetMapping("/active/{userId}")
    public QueueResponse getActiveTicket(@PathVariable Long userId) {
        return queueService.getActiveTicketForUser(userId);
    }

    @GetMapping("/status/{queueId}")
    public com.hospital.queue_backend.dto.response.QueueStatusResponse getQueueStatus(@PathVariable Long queueId) {
        return queueService.getQueueStatus(queueId);
    }

    @GetMapping("/pharmacy-queue/{hospitalId}")
    public List<QueueResponse> getPharmacyQueue(@PathVariable Long hospitalId) {
        return queueService.getPharmacyQueue(hospitalId);
    }

    @PutMapping("/pharmacy-complete/{queueId}")
    public String completePharmacy(@PathVariable Long queueId) {
        return queueService.completePharmacy(queueId);
    }

    @GetMapping("/pending-payments/{hospitalId}")
    public List<QueueResponse> getPendingPayments(@PathVariable Long hospitalId) {
        return queueService.getPendingPayments(hospitalId);
    }

    @PutMapping("/payment-complete/{queueId}")
    public String completePayment(@PathVariable Long queueId) {
        return queueService.completePayment(queueId);
    }
}

package com.hospital.queue_backend.controller;

import com.hospital.queue_backend.dto.request.MedicalRecordRequest;
import com.hospital.queue_backend.dto.response.MedicalRecordResponse;
import com.hospital.queue_backend.service.MedicalRecordService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medical-records")
@CrossOrigin(origins = "*")
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    public MedicalRecordController(MedicalRecordService medicalRecordService) {
        this.medicalRecordService = medicalRecordService;
    }

    @PostMapping
    public ResponseEntity<MedicalRecordResponse> createRecord(@RequestBody MedicalRecordRequest request) {
        return ResponseEntity.ok(medicalRecordService.createMedicalRecord(request));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<MedicalRecordResponse>> getRecordsByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(medicalRecordService.getMedicalRecordsByPatientId(patientId));
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<MedicalRecordResponse>> searchRecordsByNic(@RequestParam String nic) {
        return ResponseEntity.ok(medicalRecordService.getMedicalRecordsByNic(nic));
    }
}

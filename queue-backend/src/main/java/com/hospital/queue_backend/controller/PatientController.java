package com.hospital.queue_backend.controller;

import com.hospital.queue_backend.dto.request.PatientProfileUpdateRequest;
import com.hospital.queue_backend.dto.response.PatientProfileDTO;
import com.hospital.queue_backend.service.PatientService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "*")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @GetMapping("/profile/{userId}")
    public PatientProfileDTO getProfile(@PathVariable Long userId) {
        return patientService.getPatientProfile(userId);
    }

    @PutMapping("/profile/{userId}")
    public String updateProfile(@PathVariable Long userId, @RequestBody PatientProfileUpdateRequest request) {
        return patientService.updatePatientProfile(userId, request);
    }
}

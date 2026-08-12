package com.hospital.queue_backend.controller;

import com.hospital.queue_backend.service.DoctorService;
import org.springframework.web.bind.annotation.*;
import com.hospital.queue_backend.dto.request.DoctorRegistrationRequest;

@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "http://localhost:5173")
public class DoctorController {
    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @PostMapping("/register")
    public org.springframework.http.ResponseEntity<String> registerDoctor(@RequestBody DoctorRegistrationRequest request) {
        String result = doctorService.registerDoctor(request);
        if (result.startsWith("Error")) {
            return org.springframework.http.ResponseEntity.badRequest().body(result);
        }
        return org.springframework.http.ResponseEntity.ok(result);
    }

    @PutMapping("/update/{id}")
    public org.springframework.http.ResponseEntity<String> updateDoctor(@PathVariable Long id, @RequestBody DoctorRegistrationRequest request) {
        String result = doctorService.updateDoctor(id, request);
        if (result.startsWith("Error")) {
            return org.springframework.http.ResponseEntity.badRequest().body(result);
        }
        return org.springframework.http.ResponseEntity.ok(result);
    }

    @DeleteMapping("/delete/{id}")
    public String deleteDoctor(@PathVariable Long id) {
        return doctorService.deleteDoctor(id);
    }

    @GetMapping("/all")
    public java.util.List<com.hospital.queue_backend.dto.response.DoctorResponse> getAllDoctors() {
        return doctorService.getAllDoctors();
    }

    @GetMapping("/hospital/{hospitalId}")
    public java.util.List<com.hospital.queue_backend.dto.response.DoctorResponse> getDoctorsByHospital(@PathVariable Long hospitalId) {
        return doctorService.getDoctorsByHospitalId(hospitalId);
    }

    @PutMapping("/{id}/status")
    public org.springframework.http.ResponseEntity<String> updateStatus(@PathVariable Long id, @RequestParam boolean isAvailable) {
        try {
            String result = doctorService.updateStatus(id, isAvailable);
            return org.springframework.http.ResponseEntity.ok(result);
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/assign-hospital")
    public org.springframework.http.ResponseEntity<String> assignDoctorToHospital(@RequestBody com.hospital.queue_backend.dto.request.AssignDoctorRequest request) {
        String result = doctorService.assignDoctorToHospital(request);
        if (result.startsWith("Error")) {
            return org.springframework.http.ResponseEntity.badRequest().body(result);
        }
        return org.springframework.http.ResponseEntity.ok(result);
    }

    @GetMapping("/user/{userId}")
    public java.util.List<com.hospital.queue_backend.dto.response.DoctorProfileDTO> getDoctorProfilesByUserId(@PathVariable Long userId) {
        return doctorService.getDoctorProfilesByUserId(userId);
    }

    @GetMapping("/unique")
    public java.util.List<com.hospital.queue_backend.dto.response.UniqueDoctorDTO> getAllUniqueDoctors() {
        return doctorService.getAllUniqueDoctors();
    }
}

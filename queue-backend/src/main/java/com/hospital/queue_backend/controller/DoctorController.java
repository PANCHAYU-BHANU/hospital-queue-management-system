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
    public String registerDoctor(@RequestBody DoctorRegistrationRequest request) {
        return doctorService.registerDoctor(request);
    }
}

package com.hospital.queue_backend.controller;

import com.hospital.queue_backend.service.DoctorService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "http://localhost:5173")
public class DoctorController {
    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @PostMapping("/register")
    public String registerDoctor(@RequestBody Map<String, String> data) {
        return doctorService.registerDoctor(
                data.get("nicNumber"),
                data.get("phoneNumber"),
                data.get("password"),
                data.get("doctorName"),
                data.get("specialization"),
                data.get("roomNumber")
        );
    }
}

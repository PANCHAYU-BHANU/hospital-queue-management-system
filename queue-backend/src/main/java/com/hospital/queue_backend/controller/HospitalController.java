package com.hospital.queue_backend.controller;

import com.hospital.queue_backend.entity.Hospital;
import com.hospital.queue_backend.service.HospitalService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hospital")
@CrossOrigin(origins = "http://localhost:5173")
public class HospitalController {

    private final HospitalService hospitalService;

    public HospitalController(HospitalService hospitalService) {
        this.hospitalService = hospitalService;
    }

    @GetMapping("/all")
    public List<Hospital> getAllHospitals() {
        return hospitalService.getAllHospitals();
    }

    @GetMapping("/{id}")
    public Hospital getHospital(@PathVariable Long id) {
        return hospitalService.getHospitalById(id);
    }

    @GetMapping("/nearest")
    public Hospital getNearestHospital(@RequestParam double lat, @RequestParam double lon) {
        return hospitalService.getNearestHospital(lat, lon);
    }

    @PostMapping("/register")
    public Hospital registerHospital(@RequestBody Hospital hospital) {
        return hospitalService.createHospital(hospital);
    }
}

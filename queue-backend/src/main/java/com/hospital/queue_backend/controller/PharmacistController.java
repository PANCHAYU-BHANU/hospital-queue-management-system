package com.hospital.queue_backend.controller;

import com.hospital.queue_backend.entity.Pharmacist;
import com.hospital.queue_backend.service.PharmacistService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pharmacists")
@CrossOrigin(origins = "http://localhost:5173")
public class PharmacistController {

    private final PharmacistService pharmacistService;

    public PharmacistController(PharmacistService pharmacistService) {
        this.pharmacistService = pharmacistService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerPharmacist(@RequestBody Map<String, Object> request) {
        try {
            String nic = (String) request.get("nicNumber");
            String phone = (String) request.get("phoneNumber");
            String password = (String) request.get("password");
            String fullName = (String) request.get("fullName");
            Long hospitalId = Long.valueOf(request.get("hospitalId").toString());

            Pharmacist pharmacist = pharmacistService.registerPharmacist(nic, phone, password, fullName, hospitalId);
            return ResponseEntity.ok(pharmacist);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/hospital/{hospitalId}")
    public ResponseEntity<List<Pharmacist>> getPharmacistsByHospital(@PathVariable Long hospitalId) {
        return ResponseEntity.ok(pharmacistService.getPharmacistsByHospital(hospitalId));
    }
}

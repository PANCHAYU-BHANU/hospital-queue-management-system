package com.hospital.queue_backend.controller;

import com.hospital.queue_backend.dto.request.HospitalAdminRegistrationRequest;
import com.hospital.queue_backend.service.SuperAdminService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/superadmin")
@CrossOrigin(origins = "*")
public class SuperAdminController {

    private final SuperAdminService superAdminService;

    public SuperAdminController(SuperAdminService superAdminService) {
        this.superAdminService = superAdminService;
    }

    @PostMapping("/register-admin")
    public String registerAdmin(@RequestBody HospitalAdminRegistrationRequest request) {
        return superAdminService.registerHospitalAdmin(request);
    }

    @PutMapping("/update/{id}")
    public String updateAdmin(@PathVariable Long id, @RequestBody HospitalAdminRegistrationRequest request) {
        return superAdminService.updateHospitalAdmin(id, request);
    }

    @DeleteMapping("/delete/{id}")
    public String deleteAdmin(@PathVariable Long id) {
        return superAdminService.deleteHospitalAdmin(id);
    }

    @GetMapping("/all")
    public java.util.List<com.hospital.queue_backend.entity.HospitalAdmin> getAllAdmins() {
        return superAdminService.getAllAdmins();
    }
}

package com.hospital.queue_backend.controller;

import com.hospital.queue_backend.dto.request.CommunicationRegistrationRequest;
import com.hospital.queue_backend.entity.CommunicationCenter;
import com.hospital.queue_backend.service.CommunicationCenterService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/communication")
@CrossOrigin(origins = "*")
public class CommunicationCenterController {

    private final CommunicationCenterService communicationCenterService;

    public CommunicationCenterController(CommunicationCenterService communicationCenterService) {
        this.communicationCenterService = communicationCenterService;
    }

    @PostMapping("/register")
    public String registerCenter(@RequestBody CommunicationRegistrationRequest request) {
        return communicationCenterService.registerCommunicationCenter(request);
    }

    @GetMapping("/hospital/{hospitalId}")
    public List<CommunicationCenter> getCentersByHospital(@PathVariable Long hospitalId) {
        return communicationCenterService.getCentersByHospital(hospitalId);
    }

    @DeleteMapping("/{id}")
    public String deleteCenter(@PathVariable Long id) {
        return communicationCenterService.deleteCommunicationCenter(id);
    }
}

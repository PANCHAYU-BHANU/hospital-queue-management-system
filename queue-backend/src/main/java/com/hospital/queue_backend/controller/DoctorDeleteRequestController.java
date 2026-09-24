package com.hospital.queue_backend.controller;

import com.hospital.queue_backend.entity.DoctorDeleteRequest;
import com.hospital.queue_backend.service.DoctorDeleteRequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctor-deletes")
@CrossOrigin(origins = "*")
public class DoctorDeleteRequestController {

    private final DoctorDeleteRequestService service;

    public DoctorDeleteRequestController(DoctorDeleteRequestService service) {
        this.service = service;
    }

    @PostMapping("/request")
    public ResponseEntity<String> requestDelete(@RequestBody Map<String, Object> payload) {
        try {
            Long adminUserId = Long.valueOf(payload.get("adminUserId").toString());
            Long doctorId = Long.valueOf(payload.get("doctorId").toString());
            String reason = payload.get("reason").toString();

            String result = service.createDeleteRequest(adminUserId, doctorId, reason);
            if (result.startsWith("Error")) {
                return ResponseEntity.badRequest().body(result);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/pending")
    public List<DoctorDeleteRequest> getPendingRequests() {
        return service.getPendingRequests();
    }

    @PostMapping("/{requestId}/handle")
    public ResponseEntity<String> handleRequest(@PathVariable Long requestId, @RequestBody Map<String, Boolean> payload) {
        try {
            boolean isApproved = payload.get("isApproved");
            String result = service.handleRequest(requestId, isApproved);
            if (result.startsWith("Error")) {
                return ResponseEntity.badRequest().body(result);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}

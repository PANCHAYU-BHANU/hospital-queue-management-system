package com.hospital.queue_backend.controller;

import com.hospital.queue_backend.entity.TransferRequest;
import com.hospital.queue_backend.service.TransferService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transfers")
@CrossOrigin(origins = "*")
public class TransferController {

    private final TransferService transferService;

    public TransferController(TransferService transferService) {
        this.transferService = transferService;
    }

    @PostMapping("/request")
    public String requestTransfer(@RequestBody Map<String, Long> payload) {
        Long adminUserId = payload.get("adminUserId");
        Long doctorId = payload.get("doctorId");
        Long targetHospitalId = payload.get("targetHospitalId");
        return transferService.requestTransfer(adminUserId, doctorId, targetHospitalId);
    }

    @GetMapping("/pending")
    public List<TransferRequest> getPendingTransfers() {
        return transferService.getPendingTransfers();
    }

    @PostMapping("/{requestId}/handle")
    public String handleRequest(@PathVariable Long requestId, @RequestBody Map<String, Boolean> payload) {
        return transferService.handleTransferRequest(requestId, payload.get("isApproved"));
    }
}

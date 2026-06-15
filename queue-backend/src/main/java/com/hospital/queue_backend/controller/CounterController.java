package com.hospital.queue_backend.controller;

import com.hospital.queue_backend.dto.request.CounterRegistrationRequest;
import com.hospital.queue_backend.service.CounterService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/counters")
@CrossOrigin(origins = "http://localhost:5173")
public class CounterController {

    private final CounterService counterService;

    public CounterController(CounterService counterService) {
        this.counterService = counterService;
    }

    @PostMapping("/register")
    public String registerCounter(@RequestBody CounterRegistrationRequest request) {
        return counterService.registerCounter(request);
    }

    @PutMapping("/update/{id}")
    public String updateCounter(@PathVariable Long id, @RequestBody CounterRegistrationRequest request) {
        return counterService.updateCounter(id, request);
    }

    @DeleteMapping("/delete/{id}")
    public String deleteCounter(@PathVariable Long id) {
        return counterService.deleteCounter(id);
    }

    @GetMapping("/all")
    public java.util.List<com.hospital.queue_backend.entity.CounterStaff> getAllCounters() {
        return counterService.getAllCounters();
    }
}

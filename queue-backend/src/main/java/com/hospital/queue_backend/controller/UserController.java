package com.hospital.queue_backend.controller;

import com.hospital.queue_backend.service.UserService;
import org.springframework.web.bind.annotation.*;
import com.hospital.queue_backend.dto.request.PatientRegistrationRequest;
import com.hospital.queue_backend.dto.request.UserLoginRequest;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173") // React Frontend එකට විතරක් backend එක call කරන්න අවසර දෙනවා
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // 1. Patient Registration API
    @PostMapping("/register")
    public String register(@RequestBody PatientRegistrationRequest request) {
        return userService.registerPatient(request);
    }

    // 2. User Login API
    @PostMapping("/login")
    public String login(@RequestBody UserLoginRequest request) {
        return userService.loginUser(request);
    }
}

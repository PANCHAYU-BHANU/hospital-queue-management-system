package com.hospital.queue_backend.controller;

import com.hospital.queue_backend.service.UserService;
import org.springframework.web.bind.annotation.*;
import com.hospital.queue_backend.dto.request.PatientRegistrationRequest;
import com.hospital.queue_backend.dto.request.UserLoginRequest;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*") // React Frontend එකට විතරක් backend එක call කරන්න අවසර දෙනවා
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

    // 3. Send OTP to Patient (For Communication Center use)
    @PostMapping("/send-otp")
    public String sendOtp(@RequestBody java.util.Map<String, String> request) {
        return userService.sendOtp(request.get("nicNumber"));
    }

    // 4. Verify OTP (For Communication Center use)
    @PostMapping("/verify-otp")
    public String verifyOtp(@RequestBody java.util.Map<String, String> request) {
        return userService.verifyPatientOtp(request.get("nicNumber"), request.get("otp"));
    }

    // 5. Upload Profile Picture
    @PostMapping("/{id}/profile-picture")
    public String uploadProfilePicture(@PathVariable Long id, @RequestBody java.util.Map<String, String> request) {
        return userService.updateProfilePicture(id, request.get("profilePicture"));
    }

    // 6. Get Profile Picture
    @GetMapping("/{id}/profile-picture")
    public java.util.Map<String, String> getProfilePicture(@PathVariable Long id) {
        String base64 = userService.getProfilePicture(id);
        return java.util.Collections.singletonMap("profilePicture", base64);
    }
}

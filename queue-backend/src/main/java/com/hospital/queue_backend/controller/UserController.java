package com.hospital.queue_backend.controller;

import com.hospital.queue_backend.service.UserService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

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
    public String register(@RequestBody Map<String, String> data) {
        return userService.registerPatient(
                data.get("nicNumber"),
                data.get("phoneNumber"),
                data.get("password"),
                data.get("fullName"),
                Integer.parseInt(data.get("age")),
                data.get("gender")
        );
    }

    // 2. User Login API
    @PostMapping("/login")
    public String login(@RequestBody Map<String, String> data) {
        return userService.loginUser(
                data.get("nicNumber"),
                data.get("password")
        );
    }
}

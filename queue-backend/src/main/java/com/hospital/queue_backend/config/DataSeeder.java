package com.hospital.queue_backend.config;

import com.hospital.queue_backend.entity.User;
import com.hospital.queue_backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.Optional;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Check if super admin exists
        Optional<User> superAdminOpt = userRepository.findByNicNumber("admin");
        if (superAdminOpt.isEmpty()) {
            User superAdmin = new User();
            superAdmin.setNicNumber("admin"); // Using 'admin' as NIC for easy login
            superAdmin.setPhoneNumber("0000000000");
            superAdmin.setPassword(passwordEncoder.encode("admin123")); // Securely hashed password
            superAdmin.setRole("ROLE_SUPER_ADMIN");
            
            userRepository.save(superAdmin);
            System.out.println("✅ Super Admin account created successfully! Username: admin | Password: admin123");
        } else {
            // Update password to hashed if it was saved in plain text before
            User superAdmin = superAdminOpt.get();
            if (superAdmin.getPassword().equals("admin123")) {
                superAdmin.setPassword(passwordEncoder.encode("admin123"));
                userRepository.save(superAdmin);
                System.out.println("✅ Super Admin password upgraded to Bcrypt hash!");
            }
        }
    }
}

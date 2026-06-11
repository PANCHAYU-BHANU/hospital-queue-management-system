package com.hospital.queue_backend.service;

import com.hospital.queue_backend.entity.Patient;
import com.hospital.queue_backend.entity.User;
import com.hospital.queue_backend.repository.PatientRepository;
import com.hospital.queue_backend.repository.UserRepository;
import com.hospital.queue_backend.dto.request.PatientRegistrationRequest;
import com.hospital.queue_backend.dto.request.UserLoginRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService  {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;

    // Constructor Injection (Autowired වෙනුවට industry එකේ පාවිච්චි කරන්නේ මේකයි)
    public UserService(UserRepository userRepository, PatientRepository patientRepository) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
    }

    @Transactional // වැරදීමක් වුණොත් ටේබල් දෙකටම ඩේටා නොදා Rollback කරන්න
    public String registerPatient(PatientRegistrationRequest request) {

        // 1. දැනටමත් මේ NIC හෝ Phone එකෙන් එකවුන්ට් එකක් තියෙනවාද බලනවා
        if (userRepository.existsByNicNumber(request.getNicNumber())) {
            return "Error: NIC Number is already registered!";
        }
        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            return "Error: Phone Number is already registered!";
        }

        // 2. මුලින්ම User (Login) එකවුන්ට් එක හදනවා
        User user = new User();
        user.setNicNumber(request.getNicNumber());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setPassword(request.getPassword()); // දැනට plain text දාමු, පස්සේ Spring Security වලින් hash කරමු
        user.setRole("ROLE_PATIENT");
        User savedUser = userRepository.save(user);

        // 3. ඊට පස්සේ ඒ හැදුණු User එකට Link කරලා Patient Profile එක හදනවා
        Patient patient = new Patient();
        patient.setUser(savedUser);
        patient.setFullName(request.getFullName());
        patient.setAge(request.getAge());
        patient.setGender(request.getGender());
        patientRepository.save(patient);

        return "Patient Registered Successfully!";
    }

    // User කෙනෙක්ට Login වෙන්න තියෙන Logic එක
    public String loginUser(UserLoginRequest request) {
        // 1. දුන්න NIC එකෙන් User කෙනෙක් ඉන්නවාද බලනවා
        java.util.Optional<User> userOpt = userRepository.findByNicNumber(request.getNicNumber());

        if (userOpt.isEmpty()) {
            return "Error: User not found with this NIC!";
        }

        User user = userOpt.get();

        // 2. Password එක ගැලපෙනවාද බලනවා (දැනට plain text, පස්සේ hash කරමු)
        if (!user.getPassword().equals(request.getPassword())) {
            return "Error: Invalid password!";
        }

        // 3. හැමදේම හරි නම් එයාගේ Role එකත් එක්ක Success කියලා යවනවා
        return "Login Successful! Role: " + user.getRole();
    }
}

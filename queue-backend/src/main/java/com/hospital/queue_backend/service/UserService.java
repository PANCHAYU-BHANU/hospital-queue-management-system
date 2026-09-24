package com.hospital.queue_backend.service;

import com.hospital.queue_backend.entity.Patient;
import com.hospital.queue_backend.entity.User;
import com.hospital.queue_backend.repository.PatientRepository;
import com.hospital.queue_backend.repository.UserRepository;
import com.hospital.queue_backend.dto.request.PatientRegistrationRequest;
import com.hospital.queue_backend.dto.request.UserLoginRequest;
import com.hospital.queue_backend.repository.HospitalAdminRepository;
import com.hospital.queue_backend.entity.HospitalAdmin;
import com.hospital.queue_backend.repository.DoctorRepository;
import com.hospital.queue_backend.entity.Doctor;
import com.hospital.queue_backend.repository.CounterStaffRepository;
import com.hospital.queue_backend.entity.CounterStaff;
import com.hospital.queue_backend.repository.PharmacistRepository;
import com.hospital.queue_backend.entity.Pharmacist;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Service
public class UserService  {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final HospitalAdminRepository hospitalAdminRepository;
    private final DoctorRepository doctorRepository;
    private final CounterStaffRepository counterStaffRepository;
    private final PharmacistRepository pharmacistRepository;
    private final com.hospital.queue_backend.repository.DoctorAssignmentRepository doctorAssignmentRepository;
    private final com.hospital.queue_backend.repository.CommunicationCenterRepository communicationCenterRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PatientRepository patientRepository,
                       HospitalAdminRepository hospitalAdminRepository,
                       DoctorRepository doctorRepository,
                       CounterStaffRepository counterStaffRepository,
                       PharmacistRepository pharmacistRepository,
                       com.hospital.queue_backend.repository.DoctorAssignmentRepository doctorAssignmentRepository,
                       com.hospital.queue_backend.repository.CommunicationCenterRepository communicationCenterRepository,
                       org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.hospitalAdminRepository = hospitalAdminRepository;
        this.doctorRepository = doctorRepository;
        this.counterStaffRepository = counterStaffRepository;
        this.pharmacistRepository = pharmacistRepository;
        this.doctorAssignmentRepository = doctorAssignmentRepository;
        this.communicationCenterRepository = communicationCenterRepository;
        this.passwordEncoder = passwordEncoder;
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
        user.setPassword(passwordEncoder.encode(request.getPassword())); // Encrypt password before saving
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

        // 2. Password එක ගැලපෙනවාද බලනවා (දැන් hash කරලයි තියෙන්නේ)
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            // Also check plain text just in case it's an old user before encryption was added
            if (!user.getPassword().equals(request.getPassword())) {
                return "Error: Invalid password!";
            } else {
                // If it matched plain text, upgrade it to hashed
                user.setPassword(passwordEncoder.encode(request.getPassword()));
                userRepository.save(user);
            }
        }

        // 3. හැමදේම හරි නම් එයාගේ Role එකත් එක්ක Success කියලා යවනවා
        String response = "Login Successful! Role: " + user.getRole() + ", UserId: " + user.getId() + ", NIC: " + user.getNicNumber();
        
        if (user.getRole().equals("ROLE_ADMIN")) {
            Optional<HospitalAdmin> admin = hospitalAdminRepository.findByUser(user);
            if (admin.isPresent()) {
                response += ", HospitalId: " + admin.get().getHospital().getId();
            }
        } else if (user.getRole().equals("ROLE_DOCTOR")) {
            java.util.List<Doctor> docs = doctorRepository.findByUser(user);
            if (!docs.isEmpty()) {
                Doctor currentDoc = docs.get(0);
                response += ", HospitalId: " + currentDoc.getHospital().getId();
                response += ", DoctorId: " + currentDoc.getId();
                response += ", FullName: " + currentDoc.getDoctorName();
                
                // Get Room Name if assigned
                String roomName = "Not Assigned";
                java.util.List<com.hospital.queue_backend.entity.DoctorAssignment> assignments = doctorAssignmentRepository.findByDoctor_Id(currentDoc.getId());
                if (assignments != null && !assignments.isEmpty()) {
                    roomName = assignments.get(assignments.size() - 1).getOpdRoom().getName();
                }
                response += ", RoomName: " + roomName;
                response += ", IsAvailable: " + currentDoc.isAvailable();
            }
        } else if (user.getRole().equals("ROLE_COUNTER")) {
            Optional<CounterStaff> staff = counterStaffRepository.findByUser(user);
            if (staff.isPresent() && staff.get().getHospital() != null) {
                response += ", HospitalId: " + staff.get().getHospital().getId();
            }
        } else if (user.getRole().equals("ROLE_PHARMACIST")) {
            Optional<Pharmacist> pharmacist = pharmacistRepository.findByUserId(user.getId());
            if (pharmacist.isPresent() && pharmacist.get().getHospital() != null) {
                response += ", HospitalId: " + pharmacist.get().getHospital().getId();
                response += ", FullName: " + pharmacist.get().getFullName();
            }
        } else if (user.getRole().equals("ROLE_COMMUNICATION")) {
            java.util.Optional<com.hospital.queue_backend.entity.CommunicationCenter> center = communicationCenterRepository.findByUser(user);
            if (center.isPresent() && center.get().getHospital() != null) {
                response += ", HospitalId: " + center.get().getHospital().getId();
                response += ", CenterName: " + center.get().getCenterName();
            }
        } else if (user.getRole().equals("ROLE_PATIENT")) {
            Optional<Patient> patient = patientRepository.findByUser(user);
            if (patient.isPresent() && patient.get().getFullName() != null) {
                response += ", FullName: " + patient.get().getFullName();
            }
        }
        
        return response;
    }

    @Transactional
    public String sendOtp(String nic) {
        Optional<User> userOpt = userRepository.findByNicNumber(nic);
        if (userOpt.isEmpty() || !userOpt.get().getRole().equals("ROLE_PATIENT")) {
            return "Error: Patient not found!";
        }
        User user = userOpt.get();
        // Generate a 6-digit OTP
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        user.setOtp(otp);
        user.setOtpExpiry(java.time.LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        // Simulate SMS sending by logging to console
        System.out.println("=========================================");
        System.out.println("OTP for NIC " + nic + " is: " + otp);
        System.out.println("=========================================");

        return "OTP sent successfully to the patient's registered mobile number.";
    }

    @Transactional
    public String verifyPatientOtp(String nic, String otp) {
        Optional<User> userOpt = userRepository.findByNicNumber(nic);
        if (userOpt.isEmpty() || !userOpt.get().getRole().equals("ROLE_PATIENT")) {
            return "Error: Patient not found!";
        }
        User user = userOpt.get();

        if (user.getOtp() == null || !user.getOtp().equals(otp)) {
            return "Error: Invalid OTP!";
        }

        if (user.getOtpExpiry() == null || java.time.LocalDateTime.now().isAfter(user.getOtpExpiry())) {
            return "Error: OTP expired!";
        }

        // Clear OTP after successful verification
        user.setOtp(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        return "OTP Verified Successfully! PatientId: " + user.getId();
    }

    public String updateProfilePicture(Long userId, String base64Image) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setProfilePicture(base64Image);
            userRepository.save(user);
            return "Profile picture updated successfully";
        }
        return "Error: User not found";
    }

    public String getProfilePicture(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            return userOpt.get().getProfilePicture();
        }
        return null;
    }
}

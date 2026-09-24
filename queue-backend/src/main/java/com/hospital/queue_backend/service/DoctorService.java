package com.hospital.queue_backend.service;

import com.hospital.queue_backend.entity.Doctor;
import com.hospital.queue_backend.entity.User;
import com.hospital.queue_backend.repository.DoctorRepository;
import com.hospital.queue_backend.repository.UserRepository;
import com.hospital.queue_backend.dto.request.DoctorRegistrationRequest;
import com.hospital.queue_backend.dto.request.AssignDoctorRequest;
import com.hospital.queue_backend.dto.response.DoctorProfileDTO;
import com.hospital.queue_backend.dto.response.UniqueDoctorDTO;
import java.util.List;
import java.util.stream.Collectors;
import java.util.ArrayList;
import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hospital.queue_backend.entity.Hospital;
import com.hospital.queue_backend.repository.HospitalRepository;

@Service
public class DoctorService {
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final HospitalRepository hospitalRepository;
    private final JdbcTemplate jdbcTemplate;
    private final com.hospital.queue_backend.repository.DoctorAssignmentRepository doctorAssignmentRepository;

    public DoctorService(UserRepository userRepository, DoctorRepository doctorRepository,
            HospitalRepository hospitalRepository, com.hospital.queue_backend.repository.DoctorAssignmentRepository doctorAssignmentRepository, JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.hospitalRepository = hospitalRepository;
        this.doctorAssignmentRepository = doctorAssignmentRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void fixDatabaseConstraints() {
        try {
            jdbcTemplate.execute("ALTER TABLE doctors DROP INDEX UKt1f6cueqyjwx5ghew9ar1exe3");
            System.out.println("Dropped old unique constraint on user_id in doctors table.");
        } catch (Exception e) {
            System.out.println("Unique constraint drop skipped or already dropped: " + e.getMessage());
        }
    }

    @Transactional
    public String registerDoctor(DoctorRegistrationRequest request) {

        // 1. NIC හෝ Phone එකෙන් දැනටමත් කෙනෙක් ඉන්නවාද බලනවා
        if (userRepository.existsByNicNumber(request.getNicNumber())) {
            return "Error: NIC Number is already registered!";
        }
        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            return "Error: Phone Number is already registered!";
        }

        Hospital hospital = hospitalRepository.findById(request.getHospitalId())
                .orElseThrow(() -> new RuntimeException("Error: Hospital not found!"));

        // 2. Doctor කෙනාටත් Login එකවුන්ට් (User) එකක් හදනවා
        User user = new User();
        user.setNicNumber(request.getNicNumber());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setPassword(request.getPassword());
        user.setRole("ROLE_DOCTOR"); // Role එක DOCTOR විදියට දානවා
        User savedUser = userRepository.save(user);

        // 3. Doctor Profile එක ලින්ක් කරලා සේව් කරනවා
        Doctor doctor = new Doctor();
        doctor.setUser(savedUser);
        doctor.setDoctorName(request.getDoctorName());
        doctor.setSpecialization(request.getSpecialization());
        doctor.setHospital(hospital);
        if (request.getIsAvailable() != null) {
            doctor.setAvailable(request.getIsAvailable());
        } else {
            doctor.setAvailable(true);
        }
        doctorRepository.save(doctor);

        return "Doctor Registered Successfully!";
    }

    @Transactional
    public String assignDoctorToHospital(AssignDoctorRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Error: User not found!"));

        if (!"ROLE_DOCTOR".equals(user.getRole())) {
            return "Error: User is not a doctor!";
        }

        Hospital hospital = hospitalRepository.findById(request.getHospitalId())
                .orElseThrow(() -> new RuntimeException("Error: Hospital not found!"));

        // Check if already assigned
        boolean alreadyAssigned = doctorRepository.findByUser(user).stream()
                .anyMatch(d -> d.getHospital().getId().equals(request.getHospitalId()));
        if (alreadyAssigned) {
            return "Error: Doctor is already assigned to this hospital!";
        }

        Doctor doctor = new Doctor();
        doctor.setUser(user);
        // Get name from an existing profile
        Doctor existingProfile = doctorRepository.findByUser(user).stream().findFirst().orElse(null);
        doctor.setDoctorName(existingProfile != null ? existingProfile.getDoctorName() : "Dr.");
        doctor.setSpecialization(request.getSpecialization());
        doctor.setHospital(hospital);
        doctor.setAvailable(true);
        doctorRepository.save(doctor);

        return "Doctor successfully assigned to new hospital!";
    }

    public List<DoctorProfileDTO> getDoctorProfilesByUserId(Long userId) {
        return doctorRepository.findByUser_Id(userId).stream()
                .map(d -> new DoctorProfileDTO(
                        d.getId(),
                        d.getHospital().getId(),
                        d.getHospital().getName(),
                        d.getDoctorName(),
                        d.getSpecialization()
                ))
                .collect(Collectors.toList());
    }

    public List<UniqueDoctorDTO> getAllUniqueDoctors() {
        // Find all users who are doctors
        List<User> doctorUsers = userRepository.findAll().stream()
                .filter(u -> "ROLE_DOCTOR".equals(u.getRole()))
                .collect(Collectors.toList());

        List<UniqueDoctorDTO> uniqueDoctors = new ArrayList<>();
        for (User user : doctorUsers) {
            List<Doctor> profiles = doctorRepository.findByUser(user);
            if (!profiles.isEmpty()) {
                Doctor firstProfile = profiles.get(0);
                List<String> assignedHospitals = profiles.stream()
                        .filter(d -> d.getHospital() != null)
                        .map(d -> d.getHospital().getName() + " (" + d.getHospital().getDistrict() + ")")
                        .collect(Collectors.toList());
                
                uniqueDoctors.add(new UniqueDoctorDTO(
                        user.getId(),
                        user.getNicNumber(),
                        firstProfile.getDoctorName(),
                        firstProfile.getSpecialization(),
                        assignedHospitals
                ));
            }
        }
        return uniqueDoctors;
    }

    @Transactional
    public String deleteDoctor(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: Doctor not found!"));
        User user = doctor.getUser();
        doctorRepository.delete(doctor);
        userRepository.delete(user);
        return "Doctor deleted successfully!";
    }

    @Transactional
    public String updateDoctor(Long id, DoctorRegistrationRequest request) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: Doctor not found!"));

        User user = doctor.getUser();
        if (request.getNicNumber() != null && !request.getNicNumber().equals(user.getNicNumber())) {
            if (userRepository.existsByNicNumber(request.getNicNumber()))
                return "Error: NIC already in use!";
            user.setNicNumber(request.getNicNumber());
        }
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().equals(user.getPhoneNumber())) {
            if (userRepository.existsByPhoneNumber(request.getPhoneNumber()))
                return "Error: Phone already in use!";
            user.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(request.getPassword());
        }

        if (request.getDoctorName() != null)
            doctor.setDoctorName(request.getDoctorName());
        if (request.getSpecialization() != null)
            doctor.setSpecialization(request.getSpecialization());
        if (request.getIsAvailable() != null)
            doctor.setAvailable(request.getIsAvailable());

        userRepository.save(user);
        doctorRepository.save(doctor);
        return "Doctor updated successfully!";
    }

    private String getRoomNameForDoctor(Long doctorId) {
        java.util.List<com.hospital.queue_backend.entity.DoctorAssignment> assignments = doctorAssignmentRepository.findByDoctor_Id(doctorId);
        if (assignments != null && !assignments.isEmpty()) {
            return assignments.get(assignments.size() - 1).getOpdRoom().getName();
        }
        return "Unassigned";
    }

    @org.springframework.transaction.annotation.Transactional
    public java.util.List<com.hospital.queue_backend.dto.response.DoctorResponse> getAllDoctors() {
        doctorAssignmentRepository.deleteByAssignedDateBefore(java.time.LocalDate.now());
        return doctorRepository.findAll().stream()
                .map(doctor -> new com.hospital.queue_backend.dto.response.DoctorResponse(
                        doctor.getId(),
                        doctor.getDoctorName(),
                        doctor.getSpecialization(),
                        getRoomNameForDoctor(doctor.getId()),
                        doctor.isAvailable(),
                        doctor.getUser().getNicNumber(),
                        doctor.getUser().getPhoneNumber(),
                        isDoctorShiftActive(doctor)))
                .collect(java.util.stream.Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional
    public java.util.List<com.hospital.queue_backend.dto.response.DoctorResponse> getDoctorsByHospitalId(
            Long hospitalId) {
        doctorAssignmentRepository.deleteByAssignedDateBefore(java.time.LocalDate.now());
        return doctorRepository.findByHospital_Id(hospitalId).stream()
                .map(doctor -> new com.hospital.queue_backend.dto.response.DoctorResponse(
                        doctor.getId(),
                        doctor.getDoctorName(),
                        doctor.getSpecialization(),
                        getRoomNameForDoctor(doctor.getId()),
                        doctor.isAvailable(),
                        doctor.getUser().getNicNumber(),
                        doctor.getUser().getPhoneNumber(),
                        isDoctorShiftActive(doctor)))
                .collect(java.util.stream.Collectors.toList());
    }

    private boolean isDoctorShiftActive(Doctor doctor) {
        java.util.List<com.hospital.queue_backend.entity.DoctorAssignment> assignments = doctorAssignmentRepository.findByDoctor_Id(doctor.getId());
        if (assignments == null || assignments.isEmpty()) {
            return true; // If no specific assignment, default to available
        }
        String timePeriod = assignments.get(assignments.size() - 1).getTimePeriod();
        try {
            String[] parts = timePeriod.split("-");
            if (parts.length == 2) {
                java.time.format.DateTimeFormatter formatter = new java.time.format.DateTimeFormatterBuilder()
                        .parseCaseInsensitive()
                        .appendPattern("h:mm a")
                        .toFormatter(java.util.Locale.ENGLISH);
                java.time.LocalTime startTime = java.time.LocalTime.parse(parts[0].trim(), formatter);
                java.time.LocalTime endTime = java.time.LocalTime.parse(parts[1].trim(), formatter);
                java.time.LocalTime now = java.time.LocalTime.now();

                if (endTime.isBefore(startTime) || endTime.equals(java.time.LocalTime.MIDNIGHT)) {
                    // Shift crosses midnight
                    return !now.isBefore(startTime) || now.isBefore(endTime);
                } else {
                    // Normal shift
                    return !now.isBefore(startTime) && now.isBefore(endTime);
                }
            }
        } catch (Exception e) {
            System.err.println("Error parsing time period: " + timePeriod);
        }
        return true; // Fallback to true if parsing fails
    }

    @Transactional
    public String updateStatus(Long doctorId, boolean isAvailable) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Error: Doctor not found!"));
        doctor.setAvailable(isAvailable);
        doctorRepository.save(doctor);
        
        if (!isAvailable) {
            java.util.List<com.hospital.queue_backend.entity.DoctorAssignment> assignments = doctorAssignmentRepository.findByDoctor_Id(doctorId);
            if (!assignments.isEmpty()) {
                doctorAssignmentRepository.deleteAll(assignments);
            }
        }
        
        return "Success: Status updated to " + (isAvailable ? "Active" : "On Leave");
    }
}

package com.hospital.queue_backend.service;

import com.hospital.queue_backend.entity.Doctor;
import com.hospital.queue_backend.entity.Patient;
import com.hospital.queue_backend.entity.Queue;
import com.hospital.queue_backend.repository.DoctorRepository;
import com.hospital.queue_backend.repository.PatientRepository;
import com.hospital.queue_backend.repository.QueueRepository;
import com.hospital.queue_backend.dto.request.QueueGenerateRequest;
import com.hospital.queue_backend.dto.response.QueueResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;
import com.hospital.queue_backend.entity.User;
import com.hospital.queue_backend.repository.UserRepository;
import com.hospital.queue_backend.dto.request.OfflineQueueRequest;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class QueueService {

    private final QueueRepository queueRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final HospitalService hospitalService;
    private final UserRepository userRepository;

    private int normalPatientCounter = 0;

    public QueueService(QueueRepository queueRepository, PatientRepository patientRepository, DoctorRepository doctorRepository, HospitalService hospitalService, UserRepository userRepository) {
        this.queueRepository = queueRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.hospitalService = hospitalService;
        this.userRepository = userRepository;
    }

    // 1. ටෝකන් එකක් රික්වෙස්ට් කිරීම (Auto-approve 70+ / Put others to Pending Approval)
    public QueueResponse generateToken(QueueGenerateRequest request) {

        Patient patient = patientRepository.findByUserId(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Patient not found!"));
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found!"));

        // Check distance if GPS coordinates are provided
        if (request.getLatitude() != null && request.getLongitude() != null && doctor.getHospital() != null) {
            double distance = hospitalService.calculateDistance(request.getLatitude(), request.getLongitude(), doctor.getHospital().getLatitude(), doctor.getHospital().getLongitude());
            if (distance > 5.0) { // Max 5 km distance
                throw new RuntimeException("Error: You must be within 5km of the hospital to join the queue. You are " + String.format("%.2f", distance) + "km away.");
            }
        }

        int patientAge = patient.getAge();
        String determinedType = "NORMAL";
        String initialStatus = "PENDING"; // සාමාන්‍යයෙන් කෙලින්ම පෝලිමට වැටෙනවා

        // වයස 70+ හෝ විශේෂ අවශ්‍යතා තියෙනවා නම් PRIORITY වෙනවා
        if (patientAge >= 70 || request.isSpecialNeed()) {
            determinedType = "PRIORITY";

            // හැබැයි වයස 70ට අඩු, විශේෂ අවශ්‍යතා විතරක් දාපු අයව කවුන්ටර් ඇපෘවල් එකට දානවා!
            if (patientAge < 70) {
                initialStatus = "PENDING_APPROVAL";
            }
        }

        // ටයිප් එක අනුව අද දවසේ ඊළඟ ටෝකන් නම්බර් එක ගන්නවා
        int nextTokenNumber = queueRepository.findMaxTokenNumberForToday(request.getDoctorId(), determinedType) + 1;

        Queue queue = new Queue();
        queue.setPatient(patient);
        queue.setDoctor(doctor);
        queue.setHospital(doctor.getHospital());
        queue.setTokenNumber(nextTokenNumber);
        queue.setQueueType(determinedType);
        queue.setBookedVia("MOBILE_APP"); // Default to MOBILE_APP, can be overridden by Counter
        queue.setStatus(initialStatus); // PENDING හෝ PENDING_APPROVAL සේව් වෙනවා

        queueRepository.save(queue);

        return new QueueResponse(queue);
    }

    // 2. 🔥 කවුන්ටර් එකෙන් ලෙඩාව Approve කිරීමේ ලොජික් එක
    @Transactional
    public String approvePatientToken(Long queueId) {
        Queue queue = queueRepository.findById(queueId)
                .orElseThrow(() -> new RuntimeException("Queue record not found!"));

        if ("PENDING_APPROVAL".equals(queue.getStatus())) {
            queue.setStatus("PENDING"); // දැන් ස්ටේටස් එක පෝලිමට එකතු වෙන්න පර්මිෂන් දෙනවා
            queueRepository.save(queue);
            return "Token approved and activated successfully!";
        }

        return "Token is already active or in another status.";
    }

    // 3. 2:1 Ratio Algorithm එකෙන් ඊළඟ ලෙඩාව දොස්තරට ලබාදීම සහ Status වෙනස් කිරීම
    @Transactional
    public QueueResponse getNextPatientForDoctor(Long doctorId) {
        // Complete the current patient if any
        queueRepository.findTodayQueueForDoctor(doctorId).stream()
                .filter(q -> "IN_CONSULTATION".equals(q.getStatus()))
                .findFirst()
                .ifPresent(q -> {
                    q.setStatus("COMPLETED");
                    q.setConsultationEndTime(LocalDateTime.now());
                    queueRepository.save(q);
                });

        List<Queue> pendingPriority = queueRepository.findPendingQueueByType(doctorId, "PRIORITY");
        List<Queue> pendingNormal = queueRepository.findPendingQueueByType(doctorId, "NORMAL");

        if (pendingPriority.isEmpty() && pendingNormal.isEmpty()) {
            return null;
        }

        Queue nextPatient = null;

        if (!pendingPriority.isEmpty() && (normalPatientCounter >= 2 || pendingNormal.isEmpty())) {
            nextPatient = pendingPriority.get(0);
            normalPatientCounter = 0;
        } else if (!pendingNormal.isEmpty()) {
            nextPatient = pendingNormal.get(0);
            normalPatientCounter++;
        } else {
            nextPatient = pendingPriority.get(0);
            normalPatientCounter = 0;
        }

        nextPatient.setStatus("IN_CONSULTATION");
        nextPatient.setConsultationStartTime(LocalDateTime.now());
        queueRepository.save(nextPatient);

        return new QueueResponse(nextPatient);
    }

    public List<QueueResponse> getTodayQueue(Long doctorId) {
        return queueRepository.findTodayQueueForDoctor(doctorId)
                .stream().map(QueueResponse::new).collect(Collectors.toList());
    }

    public List<QueueResponse> getPendingApprovals() {
        return queueRepository.findTodayPendingApprovals()
                .stream().map(QueueResponse::new).collect(Collectors.toList());
    }

    @Transactional
    public String leaveQueue(Long queueId) {
        Queue queue = queueRepository.findById(queueId)
                .orElseThrow(() -> new RuntimeException("Queue record not found!"));
        
        if ("PENDING".equals(queue.getStatus()) || "PENDING_APPROVAL".equals(queue.getStatus())) {
            queueRepository.delete(queue);
            return "Successfully left the queue.";
        }
        return "Cannot leave queue from current status.";
    }

    public String getEstimatedWaitTime(Long doctorId) {
        List<Queue> completedTop5 = queueRepository.findTop5CompletedToday(doctorId, PageRequest.of(0, 5));
        if (completedTop5.size() < 5) {
            return "Calculating... (Need " + (5 - completedTop5.size()) + " more patients to complete)";
        }

        long totalMinutes = 0;
        for (Queue q : completedTop5) {
            if (q.getConsultationStartTime() != null && q.getConsultationEndTime() != null) {
                totalMinutes += ChronoUnit.MINUTES.between(q.getConsultationStartTime(), q.getConsultationEndTime());
            }
        }
        long averageMinutes = totalMinutes / 5;
        if (averageMinutes == 0) averageMinutes = 1; // Default min 1 minute

        long pendingCount = queueRepository.countPendingQueueForDoctor(doctorId);
        long estimatedMinutes = averageMinutes * pendingCount;

        return estimatedMinutes + " minutes";
    }

    @Transactional
    public String generateOfflineToken(OfflineQueueRequest request) {
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found!"));

        User user = userRepository.findByNicNumber(request.getNicNumber()).orElseGet(() -> {
            User newUser = new User();
            newUser.setNicNumber(request.getNicNumber());
            newUser.setPhoneNumber(request.getNicNumber() + "_offline"); // dummy phone
            newUser.setPassword("offline_password"); // dummy password
            newUser.setRole("ROLE_PATIENT");
            return userRepository.save(newUser);
        });

        Patient patient = patientRepository.findByUser(user).orElseGet(() -> {
            Patient newPatient = new Patient();
            newPatient.setUser(user);
            newPatient.setFullName(request.getFullName());
            newPatient.setAge(request.getAge());
            newPatient.setGender(request.getGender());
            return patientRepository.save(newPatient);
        });

        int patientAge = patient.getAge();
        String determinedType = "NORMAL";
        String initialStatus = "PENDING";

        if (patientAge >= 70 || request.isSpecialNeed()) {
            determinedType = "PRIORITY";
        }

        int nextTokenNumber = queueRepository.findMaxTokenNumberForToday(request.getDoctorId(), determinedType) + 1;

        Queue queue = new Queue();
        queue.setPatient(patient);
        queue.setDoctor(doctor);
        queue.setHospital(doctor.getHospital());
        queue.setTokenNumber(nextTokenNumber);
        queue.setQueueType(determinedType);
        queue.setBookedVia("HOSPITAL_COUNTER");
        queue.setStatus(initialStatus);

        String prefix = determinedType.equals("PRIORITY") ? "P-" : "N-";
        return "Offline Token Generated! Token Number: " + prefix + nextTokenNumber;
    }

    public QueueResponse getActiveTicketForUser(Long userId) {
        return queueRepository.findActiveQueueByUserId(userId)
                .map(QueueResponse::new)
                .orElse(null);
    }
}
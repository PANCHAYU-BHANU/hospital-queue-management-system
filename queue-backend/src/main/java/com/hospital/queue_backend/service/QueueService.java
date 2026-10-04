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

import com.hospital.queue_backend.repository.DoctorAssignmentRepository;

@Service
public class QueueService {

    private final QueueRepository queueRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final HospitalService hospitalService;
    private final UserRepository userRepository;
    private final DoctorAssignmentRepository doctorAssignmentRepository;

    private int normalPatientCounter = 0;

    public QueueService(QueueRepository queueRepository, PatientRepository patientRepository,
            DoctorRepository doctorRepository, HospitalService hospitalService, UserRepository userRepository,
            DoctorAssignmentRepository doctorAssignmentRepository) {
        this.queueRepository = queueRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.hospitalService = hospitalService;
        this.userRepository = userRepository;
        this.doctorAssignmentRepository = doctorAssignmentRepository;
    }

    private QueueResponse mapToQueueResponse(Queue queue) {
        QueueResponse response = new QueueResponse(queue);
        java.util.List<com.hospital.queue_backend.entity.DoctorAssignment> assignments = doctorAssignmentRepository.findByDoctor_Id(queue.getDoctor().getId());
        if (assignments != null && !assignments.isEmpty()) {
            response.setRoomNumber(assignments.get(assignments.size() - 1).getOpdRoom().getName());
        } else {
            response.setRoomNumber("Unassigned");
        }
        return response;
    }

    // 1. ටෝකන් එකක් රික්වෙස්ට් කිරීම (Auto-approve 70+ / Put others to Pending
    // Approval)
    public QueueResponse generateToken(QueueGenerateRequest request) {

        Patient patient = patientRepository.findByUserId(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Patient not found!"));
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found!"));

        // Check if patient already has an active token
        List<Queue> activeToken = queueRepository.findActiveQueueByUserId(request.getUserId());
        if (!activeToken.isEmpty()) {
            throw new RuntimeException(
                    "Error: You already have an active ticket. You can only hold one token at a time.");
        }

        // Check distance if GPS coordinates are provided AND it's not a Communication Center
        if (!Boolean.TRUE.equals(request.getIsCommunicationCenter())) {
            if (request.getLatitude() != null && request.getLongitude() != null && doctor.getHospital() != null) {
                double distance = hospitalService.calculateDistance(request.getLatitude(), request.getLongitude(),
                        doctor.getHospital().getLatitude(), doctor.getHospital().getLongitude());
                if (distance > 5.0) { // Max 5 km distance
                    throw new RuntimeException("Error: You must be within 5km of the hospital to join the queue. You are "
                            + String.format("%.2f", distance) + "km away.");
                }
            }
        }

        int patientAge = patient.getAge();
        String determinedType = "NORMAL";
        String initialStatus = "PENDING"; // සාමාන්‍යයෙන් කෙලින්ම පෝලිමට වැටෙනවා

        // වයස 60+ හෝ විශේෂ අවශ්‍යතා තියෙනවා නම් PRIORITY වෙනවා
        if (patientAge >= 60 || request.isSpecialNeed()) {
            determinedType = "PRIORITY";

            // හැබැයි වයස 60ට අඩු, විශේෂ අවශ්‍යතා විතරක් දාපු අයව කවුන්ටර් ඇපෘවල් එකට දානවා!
            if (patientAge < 60) {
                initialStatus = "PENDING_APPROVAL";
            }
        }

        // ටයිප් එක අනුව අද දවසේ ඊළඟ ටෝකන් නම්බර් එක ගන්නවා (දැන් globally sequential)
        int nextTokenNumber = queueRepository.findMaxTokenNumberForToday(request.getDoctorId()) + 1;

        Queue queue = new Queue();
        queue.setPatient(patient);
        queue.setDoctor(doctor);
        queue.setHospital(doctor.getHospital());
        queue.setTokenNumber(nextTokenNumber);
        queue.setQueueType(determinedType);
        queue.setBookedVia("MOBILE_APP"); // Default to MOBILE_APP, can be overridden by Counter
        queue.setStatus(initialStatus); // PENDING හෝ PENDING_APPROVAL සේව් වෙනවා

        queueRepository.save(queue);

        return mapToQueueResponse(queue);
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

    // 2.1 🔥 කවුන්ටර් එකෙන් ලෙඩාව Reject කිරීමේ ලොජික් එක
    @Transactional
    public String rejectPatientToken(Long queueId) {
        Queue queue = queueRepository.findById(queueId)
                .orElseThrow(() -> new RuntimeException("Queue record not found!"));

        if ("PENDING_APPROVAL".equals(queue.getStatus())) {
            queueRepository.delete(queue); // Database එකෙන්ම සම්පූර්ණයෙන්ම මකා දමනවා
            return "Token rejected and removed successfully!";
        }

        return "Token is already active or in another status.";
    }

    // 3. 2:1 Ratio Algorithm එකෙන් ඊළඟ ලෙඩාව දොස්තරට ලබාදීම සහ Status වෙනස් කිරීම
    @Transactional
    public QueueResponse getNextPatientForDoctor(Long doctorId) {

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

        nextPatient.setStatus("CALLED");
        queueRepository.save(nextPatient);

        return mapToQueueResponse(nextPatient);
    }

    @Transactional
    public String startConsultation(Long queueId) {
        Queue queue = queueRepository.findById(queueId)
                .orElseThrow(() -> new RuntimeException("Queue record not found!"));

        if ("CALLED".equals(queue.getStatus())) {
            queue.setStatus("IN_CONSULTATION");
            queue.setConsultationStartTime(LocalDateTime.now());
            queueRepository.save(queue);
            return "Consultation started successfully!";
        }
        return "Patient is not in CALLED status.";
    }

    @Transactional
    public String completeConsultation(Long queueId) {
        Queue queue = queueRepository.findById(queueId)
                .orElseThrow(() -> new RuntimeException("Queue record not found!"));

        if ("IN_CONSULTATION".equals(queue.getStatus()) || "CALLED".equals(queue.getStatus())) {
            queue.setStatus("PHARMACY_QUEUE");
            queue.setConsultationEndTime(LocalDateTime.now());
            queueRepository.save(queue);
            return "Consultation completed. Patient moved to Pharmacy Queue!";
        }
        return "Patient is not currently in consultation.";
    }

    public List<QueueResponse> getPharmacyQueue(Long hospitalId) {
        return queueRepository.findPharmacyQueue(hospitalId)
                .stream().map(this::mapToQueueResponse).collect(Collectors.toList());
    }

    @Transactional
    public String completePharmacy(Long queueId) {
        Queue queue = queueRepository.findById(queueId)
                .orElseThrow(() -> new RuntimeException("Queue record not found!"));

        if ("PHARMACY_QUEUE".equals(queue.getStatus())) {
            if ("MOBILE_APP".equals(queue.getBookedVia())) {
                queue.setStatus("PENDING_PAYMENT");
                queueRepository.save(queue);
                return "Pharmacy completed. Patient moved to Pending Payment Queue.";
            } else {
                queue.setStatus("COMPLETED");
                queueRepository.save(queue);
                return "Pharmacy completed. Patient consultation is now fully COMPLETE.";
            }
        }
        return "Patient is not in Pharmacy Queue.";
    }

    public List<QueueResponse> getPendingPayments(Long hospitalId) {
        return queueRepository.findPendingPayments(hospitalId)
                .stream().map(this::mapToQueueResponse).collect(Collectors.toList());
    }

    @Transactional
    public String completePayment(Long queueId) {
        Queue queue = queueRepository.findById(queueId)
                .orElseThrow(() -> new RuntimeException("Queue record not found!"));

        if ("PENDING_PAYMENT".equals(queue.getStatus())) {
            queue.setStatus("COMPLETED");
            queueRepository.save(queue);
            return "Payment received. Patient consultation is now fully COMPLETE.";
        }
        return "Patient is not in Pending Payment Queue.";
    }

    public List<QueueResponse> getTodayQueue(Long doctorId) {
        return queueRepository.findTodayQueueForDoctor(doctorId)
                .stream().map(this::mapToQueueResponse).collect(Collectors.toList());
    }

    public List<QueueResponse> getPendingApprovals() {
        return queueRepository.findTodayPendingApprovals()
                .stream().map(this::mapToQueueResponse).collect(Collectors.toList());
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
        long pendingCount = queueRepository.countPendingQueueForDoctor(doctorId);

        if (pendingCount == 0) {
            return "0 minutes (No waiting)";
        }

        long averageMinutes = getAverageConsultationTime(doctorId);
        long estimatedMinutes = averageMinutes * pendingCount;

        return estimatedMinutes + " minutes";
    }

    private long getAverageConsultationTime(Long doctorId) {
        List<Queue> completedTop5 = queueRepository.findTop5CompletedToday(doctorId, PageRequest.of(0, 5));
        if (completedTop5.isEmpty()) {
            return 5; // Default average 5 minutes if no one is completed
        }

        long totalMinutes = 0;
        for (Queue q : completedTop5) {
            if (q.getConsultationStartTime() != null && q.getConsultationEndTime() != null) {
                totalMinutes += ChronoUnit.MINUTES.between(q.getConsultationStartTime(), q.getConsultationEndTime());
            }
        }
        long averageMinutes = totalMinutes / completedTop5.size();
        if (averageMinutes == 0)
            averageMinutes = 1; // Default min 1 minute
        return averageMinutes;
    }

    public com.hospital.queue_backend.dto.response.QueueStatusResponse getQueueStatus(Long queueId) {
        Queue queue = queueRepository.findById(queueId)
                .orElseThrow(() -> new RuntimeException("Queue record not found!"));

        long normalAhead = queueRepository.countNormalPeopleAhead(queue.getDoctor().getId(), queue.getTokenNumber());
        long priorityAhead = queueRepository.countPriorityPeopleAhead(queue.getDoctor().getId(),
                queue.getTokenNumber());

        int totalAhead = (int) (normalAhead + priorityAhead);
        int avgTime = (int) getAverageConsultationTime(queue.getDoctor().getId());

        int estimatedTime = totalAhead * avgTime;

        boolean isPriority = "PRIORITY".equals(queue.getQueueType());
        int maxPrioritySlots = 0;

        if (!isPriority) {
            // For every 2 normal patients ahead, 1 priority can slip in.
            // Also, this normal patient themselves creates a potential slip-in for priority
            // after them,
            // but in terms of jumping *ahead* of this patient, we look at the chunks before
            // them.
            maxPrioritySlots = (int) Math.ceil((double) normalAhead / 2.0);
        }

        return new com.hospital.queue_backend.dto.response.QueueStatusResponse(
                totalAhead,
                estimatedTime,
                isPriority,
                queue.getStatus(),
                maxPrioritySlots,
                avgTime);
    }

    @Transactional
    public String generateOfflineToken(OfflineQueueRequest request) {
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found!"));

        User user = userRepository.findByNicNumber(request.getNicNumber()).orElseGet(() -> {
            User newUser = new User();
            newUser.setNicNumber(request.getNicNumber());
            
            // Use provided phone number or fallback to offline dummy
            if (request.getPhoneNumber() != null && !request.getPhoneNumber().trim().isEmpty()) {
                newUser.setPhoneNumber(request.getPhoneNumber());
            } else {
                newUser.setPhoneNumber(request.getNicNumber() + "_offline");
            }

            // Use provided password or fallback to dummy
            if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
                newUser.setPassword(request.getPassword());
            } else {
                newUser.setPassword("offline_password");
            }
            
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

        int nextTokenNumber = queueRepository.findMaxTokenNumberForToday(request.getDoctorId()) + 1;

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
        List<Queue> activeQueues = queueRepository.findActiveQueueByUserId(userId);
        if (!activeQueues.isEmpty()) {
            return mapToQueueResponse(activeQueues.get(0));
        }
        return null;
    }
}
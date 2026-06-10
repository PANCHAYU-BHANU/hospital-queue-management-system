package com.hospital.queue_backend.service;

import com.hospital.queue_backend.entity.Doctor;
import com.hospital.queue_backend.entity.Patient;
import com.hospital.queue_backend.entity.Queue;
import com.hospital.queue_backend.repository.DoctorRepository;
import com.hospital.queue_backend.repository.PatientRepository;
import com.hospital.queue_backend.repository.QueueRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class QueueService {

    private final QueueRepository queueRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    private int normalPatientCounter = 0;

    public QueueService(QueueRepository queueRepository, PatientRepository patientRepository, DoctorRepository doctorRepository) {
        this.queueRepository = queueRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
    }

    // 1. ටෝකන් එකක් රික්වෙස්ට් කිරීම (Auto-approve 70+ / Put others to Pending Approval)
    public String generateToken(Long patientId, Long doctorId, boolean isSpecialNeed) {

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found!"));
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found!"));

        int patientAge = patient.getAge();
        String determinedType = "NORMAL";
        String initialStatus = "PENDING"; // සාමාන්‍යයෙන් කෙලින්ම පෝලිමට වැටෙනවා

        // වයස 70+ හෝ විශේෂ අවශ්‍යතා තියෙනවා නම් PRIORITY වෙනවා
        if (patientAge >= 70 || isSpecialNeed) {
            determinedType = "PRIORITY";

            // හැබැයි වයස 70ට අඩු, විශේෂ අවශ්‍යතා විතරක් දාපු අයව කවුන්ටර් ඇපෘවල් එකට දානවා!
            if (patientAge < 70) {
                initialStatus = "PENDING_APPROVAL";
            }
        }

        // ටයිප් එක අනුව අද දවසේ ඊළඟ ටෝකන් නම්බර් එක ගන්නවා
        int nextTokenNumber = queueRepository.findMaxTokenNumberForToday(doctorId, determinedType) + 1;

        Queue queue = new Queue();
        queue.setPatient(patient);
        queue.setDoctor(doctor);
        queue.setTokenNumber(nextTokenNumber);
        queue.setQueueType(determinedType);
        queue.setStatus(initialStatus); // PENDING හෝ PENDING_APPROVAL සේව් වෙනවා

        queueRepository.save(queue);

        String prefix = determinedType.equals("PRIORITY") ? "P-" : "N-";

        if (initialStatus.equals("PENDING_APPROVAL")) {
            return "Token " + prefix + nextTokenNumber + " Requested! Please show proof to the Counter for activation.";
        }

        return "Token Generated! Your Token Number is: " + prefix + nextTokenNumber;
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

    // 3. 2:1 Ratio Algorithm එකෙන් ඊළඟ ලෙඩාව දොස්තරට ලබාදීම
    public Queue getNextPatientForDoctor(Long doctorId) {
        List<Queue> pendingPriority = queueRepository.findPendingQueueByType(doctorId, "PRIORITY");
        List<Queue> pendingNormal = queueRepository.findPendingQueueByType(doctorId, "NORMAL");

        if (pendingPriority.isEmpty() && pendingNormal.isEmpty()) {
            return null;
        }

        if (!pendingPriority.isEmpty() && (normalPatientCounter >= 2 || pendingNormal.isEmpty())) {
            Queue nextPriorityPatient = pendingPriority.get(0);
            normalPatientCounter = 0;
            return nextPriorityPatient;
        }

        if (!pendingNormal.isEmpty()) {
            Queue nextNormalPatient = pendingNormal.get(0);
            normalPatientCounter++;
            return nextNormalPatient;
        }

        Queue nextPriorityPatient = pendingPriority.get(0);
        normalPatientCounter = 0;
        return nextPriorityPatient;
    }

    public List<Queue> getTodayQueue(Long doctorId) {
        return queueRepository.findTodayQueueForDoctor(doctorId);
    }

    public List<Queue> getPendingApprovals() {
        return queueRepository.findTodayPendingApprovals();
    }
}
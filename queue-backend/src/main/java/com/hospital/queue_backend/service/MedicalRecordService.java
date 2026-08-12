package com.hospital.queue_backend.service;

import com.hospital.queue_backend.dto.request.MedicalRecordRequest;
import com.hospital.queue_backend.dto.response.MedicalRecordResponse;
import com.hospital.queue_backend.entity.Doctor;
import com.hospital.queue_backend.entity.MedicalRecord;
import com.hospital.queue_backend.entity.Patient;
import com.hospital.queue_backend.repository.DoctorRepository;
import com.hospital.queue_backend.repository.MedicalRecordRepository;
import com.hospital.queue_backend.repository.PatientRepository;
import com.hospital.queue_backend.repository.MedicineRepository;
import com.hospital.queue_backend.entity.Medicine;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final MedicineRepository medicineRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public MedicalRecordService(MedicalRecordRepository medicalRecordRepository, PatientRepository patientRepository, DoctorRepository doctorRepository, MedicineRepository medicineRepository) {
        this.medicalRecordRepository = medicalRecordRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.medicineRepository = medicineRepository;
    }

    public MedicalRecordResponse createMedicalRecord(MedicalRecordRequest request) {
        Patient patient = patientRepository.findByUser_NicNumber(request.getNicNumber())
                .orElseThrow(() -> new RuntimeException("Patient not found with NIC: " + request.getNicNumber()));
                
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        MedicalRecord record = new MedicalRecord();
        record.setPatient(patient);
        record.setDoctor(doctor);
        record.setHospital(doctor.getHospital());
        record.setDiagnosis(request.getDiagnosis());
        // Process Pharmacy Medicines and Deduct Stock
        String pharmacyMedsJson = request.getPharmacyMedicines();
        if (pharmacyMedsJson != null && !pharmacyMedsJson.trim().isEmpty() && !pharmacyMedsJson.equals("[]")) {
            try {
                JsonNode medsArray = objectMapper.readTree(pharmacyMedsJson);
                for (JsonNode medNode : medsArray) {
                    if (medNode.has("medicineId") && medNode.has("totalQuantity")) {
                        Long medId = medNode.get("medicineId").asLong();
                        int totalQty = medNode.get("totalQuantity").asInt();
                        
                        Medicine medicine = medicineRepository.findById(medId)
                                .orElseThrow(() -> new RuntimeException("Medicine not found with ID: " + medId));
                        
                        if (medicine.getAvailableQuantity() < totalQty) {
                            throw new RuntimeException("Insufficient stock for " + medicine.getName() + 
                                ". Requested: " + totalQty + ", Available: " + medicine.getAvailableQuantity());
                        }
                        
                        medicine.setAvailableQuantity(medicine.getAvailableQuantity() - totalQty);
                        medicineRepository.save(medicine);
                    }
                }
            } catch (Exception e) {
                if (e instanceof RuntimeException) {
                    throw (RuntimeException) e; // Re-throw our custom stock exceptions
                }
                // Ignore parse errors if it's old string array format for backwards compatibility
            }
        }

        record.setPharmacyMedicines(pharmacyMedsJson);
        record.setExternalMedicines(request.getExternalMedicines());
        record.setNotes(request.getNotes());
        record.setPatientAgeAtConsultation(patient.getAge());

        MedicalRecord savedRecord = medicalRecordRepository.save(record);
        return new MedicalRecordResponse(savedRecord);
    }

    public List<MedicalRecordResponse> getMedicalRecordsByPatientId(Long patientId) {
        return medicalRecordRepository.findByPatient_IdOrderByCreatedAtDesc(patientId)
                .stream()
                .map(MedicalRecordResponse::new)
                .collect(Collectors.toList());
    }
    
    public List<MedicalRecordResponse> getMedicalRecordsByNic(String nicNumber) {
        return medicalRecordRepository.findByPatient_User_NicNumberOrderByCreatedAtDesc(nicNumber)
                .stream()
                .map(MedicalRecordResponse::new)
                .collect(Collectors.toList());
    }
}

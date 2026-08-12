package com.hospital.queue_backend.service;

import com.hospital.queue_backend.entity.Hospital;
import com.hospital.queue_backend.entity.Medicine;
import com.hospital.queue_backend.repository.HospitalRepository;
import com.hospital.queue_backend.repository.MedicineRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MedicineService {

    private final MedicineRepository medicineRepository;
    private final HospitalRepository hospitalRepository;

    public MedicineService(MedicineRepository medicineRepository, HospitalRepository hospitalRepository) {
        this.medicineRepository = medicineRepository;
        this.hospitalRepository = hospitalRepository;
    }

    public Medicine addMedicine(Long hospitalId, String name, int initialQuantity, String unit) {
        Hospital hospital = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new RuntimeException("Hospital not found"));
        
        Medicine medicine = new Medicine();
        medicine.setHospital(hospital);
        medicine.setName(name);
        medicine.setAvailableQuantity(initialQuantity);
        medicine.setUnit(unit);
        
        return medicineRepository.save(medicine);
    }

    public Medicine updateStock(Long medicineId, int quantityToAdd) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));
        
        medicine.setAvailableQuantity(medicine.getAvailableQuantity() + quantityToAdd);
        return medicineRepository.save(medicine);
    }

    public List<Medicine> getMedicinesByHospital(Long hospitalId) {
        return medicineRepository.findByHospitalIdOrderByNameAsc(hospitalId);
    }
}

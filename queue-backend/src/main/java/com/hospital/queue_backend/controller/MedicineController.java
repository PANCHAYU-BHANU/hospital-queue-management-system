package com.hospital.queue_backend.controller;

import com.hospital.queue_backend.entity.Medicine;
import com.hospital.queue_backend.service.MedicineService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/medicines")
@CrossOrigin(origins = "http://localhost:5173")
public class MedicineController {

    private final MedicineService medicineService;

    public MedicineController(MedicineService medicineService) {
        this.medicineService = medicineService;
    }

    @PostMapping("/hospital/{hospitalId}")
    public ResponseEntity<?> addMedicine(@PathVariable Long hospitalId, @RequestBody Map<String, Object> request) {
        try {
            String name = (String) request.get("name");
            int quantity = Integer.parseInt(request.get("quantity").toString());
            String unit = (String) request.get("unit");
            
            Medicine medicine = medicineService.addMedicine(hospitalId, name, quantity, unit);
            return ResponseEntity.ok(medicine);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{medicineId}/stock")
    public ResponseEntity<?> updateStock(@PathVariable Long medicineId, @RequestBody Map<String, Integer> request) {
        try {
            int quantityToAdd = request.get("quantityToAdd");
            Medicine medicine = medicineService.updateStock(medicineId, quantityToAdd);
            return ResponseEntity.ok(medicine);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/hospital/{hospitalId}")
    public ResponseEntity<List<Medicine>> getMedicinesByHospital(@PathVariable Long hospitalId) {
        return ResponseEntity.ok(medicineService.getMedicinesByHospital(hospitalId));
    }
}

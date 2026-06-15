package com.hospital.queue_backend.service;

import com.hospital.queue_backend.entity.Hospital;
import com.hospital.queue_backend.repository.HospitalRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HospitalService {

    private final HospitalRepository hospitalRepository;

    public HospitalService(HospitalRepository hospitalRepository) {
        this.hospitalRepository = hospitalRepository;
    }

    public List<Hospital> getAllHospitals() {
        return hospitalRepository.findAll();
    }

    public Hospital getHospitalById(Long id) {
        return hospitalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hospital not found"));
    }

    public Hospital createHospital(Hospital hospital) {
        return hospitalRepository.save(hospital);
    }

    public Hospital getNearestHospital(double userLat, double userLon) {
        List<Hospital> hospitals = hospitalRepository.findAll();
        Hospital nearestHospital = null;
        double minDistance = Double.MAX_VALUE;

        for (Hospital hospital : hospitals) {
            double distance = calculateDistance(userLat, userLon, hospital.getLatitude(), hospital.getLongitude());
            if (distance < minDistance) {
                minDistance = distance;
                nearestHospital = hospital;
            }
        }
        return nearestHospital;
    }

    // Haversine formula to calculate distance in KM
    public double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of the earth in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}

package com.hospital.queue_backend.service;

import com.hospital.queue_backend.entity.Doctor;
import com.hospital.queue_backend.entity.DoctorAssignment;
import com.hospital.queue_backend.entity.Hospital;
import com.hospital.queue_backend.entity.OpdRoom;
import com.hospital.queue_backend.repository.DoctorAssignmentRepository;
import com.hospital.queue_backend.repository.DoctorRepository;
import com.hospital.queue_backend.repository.HospitalRepository;
import com.hospital.queue_backend.repository.OpdRoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OpdRoomService {
    private final OpdRoomRepository opdRoomRepository;
    private final HospitalRepository hospitalRepository;
    private final DoctorRepository doctorRepository;
    private final DoctorAssignmentRepository doctorAssignmentRepository;

    public OpdRoomService(OpdRoomRepository opdRoomRepository,
                          HospitalRepository hospitalRepository,
                          DoctorRepository doctorRepository,
                          DoctorAssignmentRepository doctorAssignmentRepository) {
        this.opdRoomRepository = opdRoomRepository;
        this.hospitalRepository = hospitalRepository;
        this.doctorRepository = doctorRepository;
        this.doctorAssignmentRepository = doctorAssignmentRepository;
    }

    @Transactional
    public String addOpdRoom(Long hospitalId, String roomName) {
        Hospital hospital = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new RuntimeException("Hospital not found"));
        OpdRoom room = new OpdRoom();
        room.setHospital(hospital);
        room.setName(roomName);
        opdRoomRepository.save(room);
        return "OPD Room added successfully!";
    }

    public List<OpdRoom> getRoomsByHospital(Long hospitalId) {
        return opdRoomRepository.findByHospital_Id(hospitalId);
    }

    @Transactional
    public String deleteOpdRoom(Long roomId) {
        opdRoomRepository.deleteById(roomId);
        return "OPD Room deleted successfully!";
    }

    @Transactional
    public String assignDoctorToRoom(Long roomId, Long doctorId, String timePeriod) {
        OpdRoom room = opdRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        if (!doctor.isAvailable()) {
            throw new RuntimeException("Doctor is currently on leave and cannot be assigned to a room");
        }

        DoctorAssignment assignment = new DoctorAssignment();
        assignment.setOpdRoom(room);
        assignment.setDoctor(doctor);
        assignment.setTimePeriod(timePeriod);
        assignment.setAssignedDate(java.time.LocalDate.now());
        doctorAssignmentRepository.save(assignment);
        return "Doctor assigned to room successfully!";
    }

    @Transactional
    public List<DoctorAssignment> getAssignmentsByRoom(Long roomId) {
        doctorAssignmentRepository.deleteByAssignedDateBefore(java.time.LocalDate.now());
        return doctorAssignmentRepository.findByOpdRoom_Id(roomId).stream()
                .filter(assignment -> assignment.getDoctor().isAvailable())
                .collect(java.util.stream.Collectors.toList());
    }
    
    @Transactional
    public String removeAssignment(Long assignmentId) {
        doctorAssignmentRepository.deleteById(assignmentId);
        return "Assignment removed successfully!";
    }
}

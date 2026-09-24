package com.hospital.queue_backend.controller;

import com.hospital.queue_backend.entity.DoctorAssignment;
import com.hospital.queue_backend.entity.OpdRoom;
import com.hospital.queue_backend.service.OpdRoomService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "*")
public class OpdRoomController {

    private final OpdRoomService opdRoomService;

    public OpdRoomController(OpdRoomService opdRoomService) {
        this.opdRoomService = opdRoomService;
    }

    @PostMapping("/hospital/{hospitalId}/add")
    public String addRoom(@PathVariable Long hospitalId, @RequestBody Map<String, String> payload) {
        return opdRoomService.addOpdRoom(hospitalId, payload.get("name"));
    }

    @GetMapping("/hospital/{hospitalId}")
    public List<OpdRoom> getRoomsByHospital(@PathVariable Long hospitalId) {
        return opdRoomService.getRoomsByHospital(hospitalId);
    }

    @DeleteMapping("/delete/{roomId}")
    public String deleteRoom(@PathVariable Long roomId) {
        return opdRoomService.deleteOpdRoom(roomId);
    }

    @PostMapping("/{roomId}/assign-doctor")
    public String assignDoctor(@PathVariable Long roomId, @RequestBody Map<String, String> payload) {
        Long doctorId = Long.parseLong(payload.get("doctorId"));
        String timePeriod = payload.get("timePeriod");
        return opdRoomService.assignDoctorToRoom(roomId, doctorId, timePeriod);
    }

    @GetMapping("/{roomId}/assignments")
    public List<DoctorAssignment> getAssignmentsByRoom(@PathVariable Long roomId) {
        return opdRoomService.getAssignmentsByRoom(roomId);
    }

    @DeleteMapping("/assignments/delete/{assignmentId}")
    public String removeAssignment(@PathVariable Long assignmentId) {
        return opdRoomService.removeAssignment(assignmentId);
    }
}

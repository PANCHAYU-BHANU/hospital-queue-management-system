package com.hospital.queue_backend.dto.request;

import lombok.Data;

@Data
public class AssignDoctorRequest {
    private Long userId;
    private Long hospitalId;
    private String specialization;
}

package com.hospital.queue_backend.dto.request;

import lombok.Data;

@Data
public class DoctorRegistrationRequest {
    private String nicNumber;
    private String phoneNumber;
    private String password;
    private String doctorName;
    private String specialization;
    private Long hospitalId;
    private Boolean isAvailable;
}

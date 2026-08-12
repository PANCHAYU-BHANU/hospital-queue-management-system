package com.hospital.queue_backend.dto.request;

import lombok.Data;

@Data
public class PatientProfileUpdateRequest {
    private String fullName;
    private String phoneNumber; // Updated in User table
    private String profilePictureBase64;
    private String homeAddress;
    private String alternateAddress;
    private String bloodGroup;
    private String emergencyContact;
}

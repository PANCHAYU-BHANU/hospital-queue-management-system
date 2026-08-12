package com.hospital.queue_backend.dto.response;

import lombok.Data;

@Data
public class PatientProfileDTO {
    private Long userId;
    private String fullName;
    private String nicNumber;
    private String phoneNumber;
    private int age;
    private String gender;
    private String profilePictureBase64;
    private String homeAddress;
    private String alternateAddress;
    private String bloodGroup;
    private String emergencyContact;
}

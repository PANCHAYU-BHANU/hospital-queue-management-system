package com.hospital.queue_backend.dto.request;

import lombok.Data;

@Data
public class OfflineQueueRequest {
    private String nicNumber;
    private String fullName;
    private String phoneNumber;
    private String password;
    private int age;
    private String gender;
    private Long doctorId;
    private boolean isSpecialNeed;
}

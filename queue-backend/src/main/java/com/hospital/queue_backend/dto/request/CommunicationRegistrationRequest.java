package com.hospital.queue_backend.dto.request;

import lombok.Data;

@Data
public class CommunicationRegistrationRequest {
    private String nicNumber;
    private String phoneNumber;
    private String password;
    private String centerName;
    private Long hospitalId;
}

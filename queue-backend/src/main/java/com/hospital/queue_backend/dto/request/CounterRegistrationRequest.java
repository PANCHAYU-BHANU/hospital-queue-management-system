package com.hospital.queue_backend.dto.request;

import lombok.Data;

@Data
public class CounterRegistrationRequest {
    private String nicNumber;
    private String phoneNumber;
    private String password;
    private String fullName;
    private String counterNumber;
    private Long hospitalId;
}

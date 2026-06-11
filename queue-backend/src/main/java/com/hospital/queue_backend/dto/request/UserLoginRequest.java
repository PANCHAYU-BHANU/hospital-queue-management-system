package com.hospital.queue_backend.dto.request;

import lombok.Data;

@Data
public class UserLoginRequest {
    private String nicNumber;
    private String password;
}

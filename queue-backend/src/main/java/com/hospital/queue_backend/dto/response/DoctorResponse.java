package com.hospital.queue_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DoctorResponse {
    private Long id;
    private String doctorName;
    private String specialization;
    private String roomNumber;
    private boolean isAvailable;
}

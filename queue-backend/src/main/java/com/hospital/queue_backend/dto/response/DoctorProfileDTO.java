package com.hospital.queue_backend.dto.response;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoctorProfileDTO {
    private Long doctorId;
    private Long hospitalId;
    private String hospitalName;
    private String doctorName;
    private String specialization;
}

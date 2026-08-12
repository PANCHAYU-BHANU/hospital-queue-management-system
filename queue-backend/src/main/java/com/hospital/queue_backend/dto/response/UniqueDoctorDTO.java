package com.hospital.queue_backend.dto.response;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UniqueDoctorDTO {
    private Long userId;
    private String nicNumber;
    private String doctorName;
    private String mainSpecialization;
    private List<String> assignedHospitals;
}

package com.hospital.queue_backend.dto.request;

import lombok.Data;

@Data
public class QueueGenerateRequest {
    private Long patientId;
    private Long doctorId;
    private boolean isSpecialNeed;
}

package com.hospital.queue_backend.dto.request;

import lombok.Data;

@Data
public class QueueGenerateRequest {
    private Long userId;
    private Long doctorId;
    private boolean isSpecialNeed;
    private Double latitude;
    private Double longitude;
}

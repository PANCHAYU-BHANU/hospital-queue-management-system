package com.hospital.queue_backend.dto.response;

import com.hospital.queue_backend.entity.Queue;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class QueueResponse {
    private Long id;
    private String patientName;
    private String patientNic;
    private String patientPhone;
    private String doctorName;
    private int tokenNumber;
    private String status;
    private String bookedVia;
    private String queueType;
    private LocalDateTime createdAt;
    private String roomNumber;

    public QueueResponse(Queue queue) {
        this.id = queue.getId();
        this.patientName = queue.getPatient() != null ? queue.getPatient().getFullName() : null;
        this.patientNic = queue.getPatient() != null && queue.getPatient().getUser() != null
                ? queue.getPatient().getUser().getNicNumber()
                : null;
        this.patientPhone = queue.getPatient() != null && queue.getPatient().getUser() != null
                ? queue.getPatient().getUser().getPhoneNumber()
                : null;
        this.doctorName = queue.getDoctor() != null ? queue.getDoctor().getDoctorName() : null;
        this.tokenNumber = queue.getTokenNumber();
        this.status = queue.getStatus();
        this.bookedVia = queue.getBookedVia();
        this.queueType = queue.getQueueType();
        this.createdAt = queue.getCreatedAt();
    }
}

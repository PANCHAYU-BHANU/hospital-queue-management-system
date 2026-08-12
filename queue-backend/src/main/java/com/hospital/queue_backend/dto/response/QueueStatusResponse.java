package com.hospital.queue_backend.dto.response;

public class QueueStatusResponse {
    private int positionInQueue;
    private int estimatedWaitTimeMinutes;
    private boolean isPriority;
    private String status;
    private int maxPrioritySlots;
    private int avgTimePerPatient;
    
    // Default constructor
    public QueueStatusResponse() {}
    
    public QueueStatusResponse(int positionInQueue, int estimatedWaitTimeMinutes, boolean isPriority, String status, int maxPrioritySlots, int avgTimePerPatient) {
        this.positionInQueue = positionInQueue;
        this.estimatedWaitTimeMinutes = estimatedWaitTimeMinutes;
        this.isPriority = isPriority;
        this.status = status;
        this.maxPrioritySlots = maxPrioritySlots;
        this.avgTimePerPatient = avgTimePerPatient;
    }

    public int getPositionInQueue() {
        return positionInQueue;
    }
    public void setPositionInQueue(int positionInQueue) {
        this.positionInQueue = positionInQueue;
    }
    public int getEstimatedWaitTimeMinutes() {
        return estimatedWaitTimeMinutes;
    }
    public void setEstimatedWaitTimeMinutes(int estimatedWaitTimeMinutes) {
        this.estimatedWaitTimeMinutes = estimatedWaitTimeMinutes;
    }
    public boolean isPriority() {
        return isPriority;
    }
    public void setPriority(boolean priority) {
        this.isPriority = priority;
    }
    public String getStatus() {
        return status;
    }
    public void setStatus(String status) {
        this.status = status;
    }
    public int getMaxPrioritySlots() {
        return maxPrioritySlots;
    }
    public void setMaxPrioritySlots(int maxPrioritySlots) {
        this.maxPrioritySlots = maxPrioritySlots;
    }
    public int getAvgTimePerPatient() {
        return avgTimePerPatient;
    }
    public void setAvgTimePerPatient(int avgTimePerPatient) {
        this.avgTimePerPatient = avgTimePerPatient;
    }
}

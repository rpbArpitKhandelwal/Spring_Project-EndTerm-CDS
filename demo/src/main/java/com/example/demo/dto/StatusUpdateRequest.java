package com.example.demo.dto;

import com.example.demo.enums.Status;
import jakarta.validation.constraints.NotNull;

public class StatusUpdateRequest {

    @NotNull(message = "Status is required (NEW, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED)")
    private Status status;

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
}

package com.example.demo.controller;

import com.example.demo.dto.ComplaintRequest;
import com.example.demo.dto.StatusUpdateRequest;
import com.example.demo.entity.Complaint;
import com.example.demo.enums.Status;
import com.example.demo.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @PostMapping
    public ResponseEntity<Complaint> createComplaint(@Valid @RequestBody ComplaintRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(complaintService.createComplaint(request));
    }

    @GetMapping
    public ResponseEntity<List<Complaint>> getAllComplaints() {
        return ResponseEntity.ok(complaintService.getAllComplaints());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Complaint> getComplaintById(@PathVariable Long id) {
        return ResponseEntity.ok(complaintService.getComplaintById(id));
    }

    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<Complaint> getByTicketId(@PathVariable String ticketId) {
        return ResponseEntity.ok(complaintService.getComplaintByTicketId(ticketId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Complaint>> getComplaintsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(complaintService.getComplaintsByUser(userId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Complaint>> getByStatus(@PathVariable Status status) {
        return ResponseEntity.ok(complaintService.getComplaintsByStatus(status));
    }

    @GetMapping("/agent/{agentId}")
    public ResponseEntity<List<Complaint>> getByAgent(@PathVariable Long agentId) {
        return ResponseEntity.ok(complaintService.getComplaintsByAgent(agentId));
    }

    @GetMapping("/unassigned")
    public ResponseEntity<List<Complaint>> getUnassigned() {
        return ResponseEntity.ok(complaintService.getUnassignedComplaints());
    }

    @GetMapping("/active")
    public ResponseEntity<List<Complaint>> getActive() {
        return ResponseEntity.ok(complaintService.getActiveComplaints());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Complaint> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request) {
        return ResponseEntity.ok(complaintService.updateStatus(id, request));
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<Complaint> assignComplaint(
            @PathVariable Long id,
            @RequestParam Long adminId,
            @RequestParam(required = false) Long agentId) {
        return ResponseEntity.ok(complaintService.assignComplaint(id, adminId, agentId));
    }

    @PutMapping("/{id}/claim")
    public ResponseEntity<Complaint> claimComplaint(
            @PathVariable Long id,
            @RequestParam Long agentId) {
        return ResponseEntity.ok(complaintService.claimComplaint(id, agentId));
    }
}

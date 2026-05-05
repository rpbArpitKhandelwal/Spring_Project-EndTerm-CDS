package com.example.demo.service;

import com.example.demo.dto.ComplaintRequest;
import com.example.demo.dto.StatusUpdateRequest;
import com.example.demo.entity.Comment;
import com.example.demo.entity.Complaint;
import com.example.demo.entity.User;
import com.example.demo.enums.Role;
import com.example.demo.enums.Status;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.ComplaintRepository;
import com.example.demo.repository.CommentRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final CommentRepository commentRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    public ComplaintService(ComplaintRepository complaintRepository,
                            CommentRepository commentRepository,
                            UserService userService,
                            @Lazy NotificationService notificationService) {
        this.complaintRepository = complaintRepository;
        this.commentRepository = commentRepository;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    private String generateTicketId() {
        return "TKT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    // ── Add system audit log entry ───────────────────────────
    private void addSystemLog(Complaint complaint, String message) {
        Comment log = new Comment();
        log.setMessage(message);
        log.setCommentType("SYSTEM_LOG");
        log.setComplaint(complaint);
        log.setUser(null);
        commentRepository.save(log);
    }

    public Complaint createComplaint(ComplaintRequest request) {
        User user = userService.getUserById(request.getUserId());
        Complaint complaint = new Complaint();
        complaint.setTicketId(generateTicketId());
        complaint.setTitle(request.getTitle());
        complaint.setDescription(request.getDescription());
        complaint.setCategory(request.getCategory());
        complaint.setPriority(request.getPriority());
        complaint.setStatus(Status.NEW);
        complaint.setUser(user);
        Complaint saved = complaintRepository.save(complaint);

        addSystemLog(saved, "✅ Complaint created by " + user.getName() + " with priority " + request.getPriority());
        notificationService.onComplaintCreated(saved);
        return saved;
    }

    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAll();
    }

    public Complaint getComplaintById(Long id) {
        return complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));
    }

    public Complaint getComplaintByTicketId(String ticketId) {
        return complaintRepository.findByTicketId(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with ticket: " + ticketId));
    }

    public List<Complaint> getComplaintsByUser(Long userId) {
        userService.getUserById(userId);
        return complaintRepository.findByUserId(userId);
    }

    public List<Complaint> getComplaintsByStatus(Status status) {
        return complaintRepository.findByStatus(status);
    }

    public List<Complaint> getComplaintsByAgent(Long agentId) {
        userService.getUserById(agentId);
        return complaintRepository.findByAssignedAgentId(agentId);
    }

    public List<Complaint> getUnassignedComplaints() {
        return complaintRepository.findByAssignedAgentIsNull();
    }

    public List<Complaint> getActiveComplaints() {
        return complaintRepository.findByStatusIn(Arrays.asList(Status.ASSIGNED, Status.IN_PROGRESS));
    }

    public Complaint updateStatus(Long id, StatusUpdateRequest request) {
        Complaint complaint = getComplaintById(id);
        String oldStatus = complaint.getStatus().name();
        complaint.setStatus(request.getStatus());
        Complaint saved = complaintRepository.save(complaint);

        addSystemLog(saved, "🔄 Status changed: " + oldStatus + " → " + request.getStatus().name());
        notificationService.onStatusChanged(saved, oldStatus, request.getStatus().name());
        return saved;
    }

    public Complaint assignComplaint(Long complaintId, Long adminId, Long agentId) {
        User admin = userService.getUserById(adminId);
        if (admin.getRole() != Role.ADMIN) {
            throw new BadRequestException("Only ADMIN users can assign complaints.");
        }
        Complaint complaint = getComplaintById(complaintId);
        complaint.setStatus(Status.ASSIGNED);

        if (agentId != null) {
            User agent = userService.getUserById(agentId);
            if (agent.getRole() != Role.AGENT) {
                throw new BadRequestException("Target user must have AGENT role.");
            }
            complaint.setAssignedAgent(agent);
            addSystemLog(complaint, "📌 Assigned to agent: " + agent.getName() + " by admin: " + admin.getName());
            Complaint saved = complaintRepository.save(complaint);
            notificationService.onAgentAssigned(saved, agent);
            return saved;
        }

        addSystemLog(complaint, "📌 Marked as ASSIGNED by admin: " + admin.getName());
        Complaint saved = complaintRepository.save(complaint);
        notificationService.onStatusChanged(saved, "NEW", "ASSIGNED");
        return saved;
    }

    // Agent claims an unassigned complaint
    public Complaint claimComplaint(Long complaintId, Long agentId) {
        User agent = userService.getUserById(agentId);
        if (agent.getRole() != Role.AGENT) {
            throw new BadRequestException("Only AGENT users can claim complaints.");
        }
        Complaint complaint = getComplaintById(complaintId);
        complaint.setAssignedAgent(agent);
        complaint.setStatus(Status.IN_PROGRESS);
        addSystemLog(complaint, "👷 Claimed by agent: " + agent.getName());
        Complaint saved = complaintRepository.save(complaint);
        notificationService.onAgentAssigned(saved, agent);
        return saved;
    }
}

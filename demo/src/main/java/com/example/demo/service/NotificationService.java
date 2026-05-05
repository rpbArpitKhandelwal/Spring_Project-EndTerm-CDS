package com.example.demo.service;

import com.example.demo.entity.Complaint;
import com.example.demo.entity.Notification;
import com.example.demo.entity.User;
import com.example.demo.enums.Role;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    // ── Create a notification for a single user ──────────────
    public void notify(User recipient, String message, String type, Complaint complaint) {
        Notification n = new Notification();
        n.setRecipient(recipient);
        n.setMessage(message);
        n.setType(type);
        n.setComplaint(complaint);
        notificationRepository.save(n);

        // Simulate email/SMS log
        System.out.printf("[EMAIL SIM] To: %s <%s> | %s: %s%n",
                recipient.getName(), recipient.getEmail(), type, message);
    }

    // ── Notify all users of a given role ─────────────────────
    private void notifyRole(Role role, String message, String type, Complaint complaint) {
        userRepository.findByRole(role).forEach(u -> notify(u, message, type, complaint));
    }

    // ── On new complaint created ──────────────────────────────
    public void onComplaintCreated(Complaint complaint) {
        String msg = String.format("🆕 New complaint [%s]: \"%s\" (Priority: %s)",
                complaint.getTicketId(), complaint.getTitle(), complaint.getPriority());
        notifyRole(Role.ADMIN, msg, "INFO", complaint);
        notifyRole(Role.AGENT, msg, "INFO", complaint);
    }

    // ── On status changed ─────────────────────────────────────
    public void onStatusChanged(Complaint complaint, String oldStatus, String newStatus) {
        // Notify complaint owner
        String userMsg = String.format("📋 Your complaint [%s] status changed: %s → %s",
                complaint.getTicketId(), oldStatus, newStatus);
        notify(complaint.getUser(), userMsg, "SUCCESS", complaint);

        // Notify assigned agent if any
        if (complaint.getAssignedAgent() != null && !complaint.getAssignedAgent().equals(complaint.getUser())) {
            String agentMsg = String.format("🔄 Complaint [%s] status updated to %s",
                    complaint.getTicketId(), newStatus);
            notify(complaint.getAssignedAgent(), agentMsg, "INFO", complaint);
        }

        // Notify all admins
        String adminMsg = String.format("🔄 Complaint [%s] by %s: %s → %s",
                complaint.getTicketId(), complaint.getUser().getName(), oldStatus, newStatus);
        userRepository.findByRole(Role.ADMIN).forEach(admin -> {
            if (!admin.equals(complaint.getUser())) notify(admin, adminMsg, "INFO", complaint);
        });

        System.out.printf("[SMS SIM] To: %s | Status Update: %s → %s for ticket %s%n",
                complaint.getUser().getEmail(), oldStatus, newStatus, complaint.getTicketId());
    }

    // ── On agent assignment ───────────────────────────────────
    public void onAgentAssigned(Complaint complaint, User agent) {
        String agentMsg = String.format("📌 Complaint [%s] assigned to you: \"%s\"",
                complaint.getTicketId(), complaint.getTitle());
        notify(agent, agentMsg, "WARNING", complaint);

        String ownerMsg = String.format("👷 Agent %s has been assigned to your complaint [%s]",
                agent.getName(), complaint.getTicketId());
        notify(complaint.getUser(), ownerMsg, "SUCCESS", complaint);
    }

    // ── On new comment ────────────────────────────────────────
    public void onCommentAdded(Complaint complaint, User commenter, String commentType) {
        if ("SYSTEM_LOG".equals(commentType)) return;
        if (commenter.getRole() == Role.USER) {
            // Notify admins and assigned agent
            String msg = String.format("💬 User %s commented on complaint [%s]",
                    commenter.getName(), complaint.getTicketId());
            userRepository.findByRole(Role.ADMIN).forEach(a -> notify(a, msg, "INFO", complaint));
            if (complaint.getAssignedAgent() != null)
                notify(complaint.getAssignedAgent(), msg, "INFO", complaint);
        } else {
            // Notify complaint owner
            String role = commenter.getRole() == Role.AGENT ? "Agent" : "Admin";
            String msg = String.format("💬 %s %s replied on complaint [%s]",
                    role, commenter.getName(), complaint.getTicketId());
            if (!complaint.getUser().equals(commenter))
                notify(complaint.getUser(), msg, "INFO", complaint);
        }
    }

    // ── Read operations ───────────────────────────────────────
    public List<Notification> getForUser(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndReadFalse(userId);
    }

    public void markRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    public void markAllRead(Long userId) {
        notificationRepository.markAllReadByUser(userId);
    }
}

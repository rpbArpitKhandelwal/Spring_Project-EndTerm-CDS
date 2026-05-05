package com.example.demo.service;

import com.example.demo.dto.CommentRequest;
import com.example.demo.entity.Comment;
import com.example.demo.entity.Complaint;
import com.example.demo.entity.User;
import com.example.demo.repository.CommentRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final ComplaintService complaintService;
    private final UserService userService;
    private final NotificationService notificationService;

    public CommentService(CommentRepository commentRepository,
                          ComplaintService complaintService,
                          UserService userService,
                          @Lazy NotificationService notificationService) {
        this.commentRepository = commentRepository;
        this.complaintService = complaintService;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    public Comment addComment(Long complaintId, CommentRequest request) {
        Complaint complaint = complaintService.getComplaintById(complaintId);
        User user = userService.getUserById(request.getUserId());

        // Determine comment type based on user role
        String commentType = switch (user.getRole()) {
            case AGENT -> "AGENT_NOTE";
            case ADMIN -> "AGENT_NOTE";
            default -> "USER_COMMENT";
        };

        Comment comment = new Comment();
        comment.setMessage(request.getMessage());
        comment.setCommentType(commentType);
        comment.setComplaint(complaint);
        comment.setUser(user);
        Comment saved = commentRepository.save(comment);

        notificationService.onCommentAdded(complaint, user, commentType);
        return saved;
    }

    public List<Comment> getCommentsByComplaint(Long complaintId) {
        complaintService.getComplaintById(complaintId);
        return commentRepository.findByComplaintIdOrderByCreatedAtAsc(complaintId);
    }
}

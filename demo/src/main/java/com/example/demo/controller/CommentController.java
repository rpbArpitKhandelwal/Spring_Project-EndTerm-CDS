package com.example.demo.controller;

import com.example.demo.dto.CommentRequest;
import com.example.demo.entity.Comment;
import com.example.demo.service.CommentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/complaints/{complaintId}/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    // Add comment/feedback to a complaint
    @PostMapping
    public ResponseEntity<Comment> addComment(
            @PathVariable Long complaintId,
            @Valid @RequestBody CommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentService.addComment(complaintId, request));
    }

    // View comment thread for a complaint
    @GetMapping
    public ResponseEntity<List<Comment>> getComments(@PathVariable Long complaintId) {
        return ResponseEntity.ok(commentService.getCommentsByComplaint(complaintId));
    }
}

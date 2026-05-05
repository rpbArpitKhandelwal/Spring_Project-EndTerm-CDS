package com.example.demo.controller;

import com.example.demo.entity.Attachment;
import com.example.demo.service.AttachmentService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api")
public class AttachmentController {

    private final AttachmentService attachmentService;

    public AttachmentController(AttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    // POST /api/complaints/{complaintId}/attachments?userId=X
    @PostMapping("/complaints/{complaintId}/attachments")
    public ResponseEntity<?> upload(
            @PathVariable Long complaintId,
            @RequestParam Long userId,
            @RequestParam("file") MultipartFile file) {
        try {
            Attachment saved = attachmentService.upload(complaintId, userId, file);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("File upload failed: " + e.getMessage());
        }
    }

    // GET /api/complaints/{complaintId}/attachments
    @GetMapping("/complaints/{complaintId}/attachments")
    public ResponseEntity<List<Attachment>> list(@PathVariable Long complaintId) {
        return ResponseEntity.ok(attachmentService.getByComplaint(complaintId));
    }

    // GET /api/attachments/{id}/download
    @GetMapping("/attachments/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        Resource resource = attachmentService.download(id);
        String contentType = attachmentService.getFileType(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}

package com.example.demo.service;

import com.example.demo.entity.Attachment;
import com.example.demo.entity.Complaint;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.AttachmentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@Service
public class AttachmentService {

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    private final AttachmentRepository attachmentRepository;
    private final ComplaintService complaintService;
    private final UserService userService;

    public AttachmentService(AttachmentRepository attachmentRepository,
                             ComplaintService complaintService,
                             UserService userService) {
        this.attachmentRepository = attachmentRepository;
        this.complaintService = complaintService;
        this.userService = userService;
    }

    public Attachment upload(Long complaintId, Long userId, MultipartFile file) throws IOException {
        Complaint complaint = complaintService.getComplaintById(complaintId);
        User user = userService.getUserById(userId);

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null ||
            (!contentType.startsWith("image/") && !contentType.equals("application/pdf"))) {
            throw new IllegalArgumentException("Only image and PDF files are allowed.");
        }

        // Create directory
        Path dir = Paths.get(uploadDir, "complaint-" + complaintId);
        Files.createDirectories(dir);

        // Unique filename
        String ext = "";
        String original = file.getOriginalFilename();
        if (original != null && original.contains("."))
            ext = original.substring(original.lastIndexOf('.'));
        String savedName = UUID.randomUUID().toString() + ext;
        Path dest = dir.resolve(savedName);
        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

        Attachment attachment = new Attachment();
        attachment.setFileName(original);
        attachment.setFileType(contentType);
        attachment.setFileSize(file.getSize());
        attachment.setStoragePath(dest.toString());
        attachment.setComplaint(complaint);
        attachment.setUploadedBy(user);
        return attachmentRepository.save(attachment);
    }

    public List<Attachment> getByComplaint(Long complaintId) {
        complaintService.getComplaintById(complaintId);
        return attachmentRepository.findByComplaintId(complaintId);
    }

    public Resource download(Long attachmentId) {
        Attachment a = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found: " + attachmentId));
        try {
            Path path = Paths.get(a.getStoragePath());
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists()) throw new ResourceNotFoundException("File not found on disk.");
            return resource;
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("Could not read file.");
        }
    }

    public String getFileType(Long attachmentId) {
        return attachmentRepository.findById(attachmentId)
                .map(Attachment::getFileType)
                .orElse("application/octet-stream");
    }
}

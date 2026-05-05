package com.example.demo.repository;

import com.example.demo.entity.Complaint;
import com.example.demo.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findByUserId(Long userId);
    Optional<Complaint> findByTicketId(String ticketId);
    List<Complaint> findByStatus(Status status);
    List<Complaint> findByAssignedAgentId(Long agentId);
    List<Complaint> findByStatusIn(List<Status> statuses);
    List<Complaint> findByAssignedAgentIsNull();
}

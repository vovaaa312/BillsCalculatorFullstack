package com.example.billscalculatorbackend.repository;

import com.example.billscalculatorbackend.model.RegistrationRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RegistrationRequestRepository extends JpaRepository<RegistrationRequest, Long> {
    boolean existsByEmail(String email);
    List<RegistrationRequest> findByStatusOrderByCreatedAtDesc(String status);
}

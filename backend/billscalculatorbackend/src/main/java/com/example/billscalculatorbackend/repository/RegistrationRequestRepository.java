package com.example.billscalculatorbackend.repository;

import com.example.billscalculatorbackend.model.RegistrationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface RegistrationRequestRepository extends JpaRepository<RegistrationRequest, Long> {
    boolean existsByEmail(String email);
    boolean existsByEmailAndStatus(String email, String status);
    @Transactional
    void deleteByEmail(String email);
    List<RegistrationRequest> findByStatusOrderByCreatedAtDesc(String status);
}

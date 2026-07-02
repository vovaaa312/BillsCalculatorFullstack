package com.example.billscalculatorbackend.repository;

import com.example.billscalculatorbackend.model.AuditLog;
import com.example.billscalculatorbackend.model.LogCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {

    @Transactional
    void deleteByCategory(LogCategory category);

    @Transactional
    void deleteByTimestampBeforeAndCategory(LocalDateTime cutoff, LogCategory category);
}

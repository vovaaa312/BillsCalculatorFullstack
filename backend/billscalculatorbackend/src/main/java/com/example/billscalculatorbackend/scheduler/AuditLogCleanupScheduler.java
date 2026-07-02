package com.example.billscalculatorbackend.scheduler;

import com.example.billscalculatorbackend.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class AuditLogCleanupScheduler {

    private final AuditService auditService;

    @Scheduled(cron = "0 0 2 * * *")
    public void cleanupOldActivityLogs() {
        auditService.cleanupOldActivity(LocalDateTime.now().minusDays(90));
    }
}

package com.example.billscalculatorbackend.dto;

import com.example.billscalculatorbackend.model.AuditLog;

public record AuditLogDto(
        Long id,
        String userEmail,
        String action,
        String entityType,
        String entityId,
        String status,
        String ipAddress,
        String details,
        String category,
        String timestamp
) {
    public static AuditLogDto from(AuditLog log) {
        return new AuditLogDto(
                log.getId(),
                log.getUserEmail(),
                log.getAction(),
                log.getEntityType(),
                log.getEntityId(),
                log.getStatus(),
                log.getIpAddress(),
                log.getDetails(),
                log.getCategory() != null ? log.getCategory().name() : null,
                log.getTimestamp() != null ? log.getTimestamp().toString() + "Z" : null
        );
    }
}

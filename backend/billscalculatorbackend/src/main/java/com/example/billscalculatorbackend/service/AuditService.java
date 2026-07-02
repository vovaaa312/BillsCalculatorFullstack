package com.example.billscalculatorbackend.service;

import com.example.billscalculatorbackend.dto.AuditLogFilterDto;
import com.example.billscalculatorbackend.model.AuditLog;
import com.example.billscalculatorbackend.model.LogCategory;
import com.example.billscalculatorbackend.repository.AuditLogRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository repo;

    public void log(String userEmail, String action, String entityType, String entityId,
                    String status, String ipAddress, String details, LogCategory category) {
        AuditLog entry = new AuditLog();
        entry.setUserEmail(userEmail);
        entry.setAction(action);
        entry.setEntityType(entityType != null && !entityType.trim().isEmpty() ? entityType : null);
        entry.setEntityId(entityId);
        entry.setStatus(status);
        entry.setIpAddress(ipAddress);
        entry.setDetails(details);
        entry.setCategory(category);
        entry.setTimestamp(LocalDateTime.now());
        repo.save(entry);
    }

    public void log(String action, String entityType, String entityId,
                    String status, String ipAddress, String details, LogCategory category) {
        log(resolveEmail(), action, entityType, entityId, status, ipAddress, details, category);
    }

    public Page<AuditLog> findAll(AuditLogFilterDto filter, Pageable pageable) {
        return repo.findAll(toSpec(filter), pageable);
    }

    @Transactional
    public void deleteActivity() {
        repo.deleteByCategory(LogCategory.ACTIVITY);
    }

    @Transactional
    public void deleteAll() {
        repo.deleteAll();
    }

    @Transactional
    public void cleanupOldActivity(LocalDateTime before) {
        repo.deleteByTimestampBeforeAndCategory(before, LogCategory.ACTIVITY);
    }

    private String resolveEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return null;
    }

    private static Specification<AuditLog> toSpec(AuditLogFilterDto f) {
        return (root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            if (hasText(f.getUserEmail()))
                preds.add(cb.like(cb.lower(root.get("userEmail")), "%" + f.getUserEmail().toLowerCase() + "%"));
            if (hasText(f.getAction()))
                preds.add(cb.equal(root.get("action"), f.getAction()));
            if (hasText(f.getCategory())) {
                try {
                    preds.add(cb.equal(root.get("category"), LogCategory.valueOf(f.getCategory())));
                } catch (IllegalArgumentException ignored) {}
            }
            if (hasText(f.getStatus()))
                preds.add(cb.equal(root.get("status"), f.getStatus()));
            if (hasText(f.getDateFrom())) {
                try {
                    preds.add(cb.greaterThanOrEqualTo(root.get("timestamp"),
                            LocalDateTime.parse(f.getDateFrom() + "T00:00:00")));
                } catch (Exception ignored) {}
            }
            if (hasText(f.getDateTo())) {
                try {
                    preds.add(cb.lessThanOrEqualTo(root.get("timestamp"),
                            LocalDateTime.parse(f.getDateTo() + "T23:59:59")));
                } catch (Exception ignored) {}
            }
            return cb.and(preds.toArray(new Predicate[0]));
        };
    }

    private static boolean hasText(String s) {
        return s != null && !s.trim().isEmpty();
    }
}

package com.example.billscalculatorbackend.controller;

import com.example.billscalculatorbackend.annotation.Audit;
import com.example.billscalculatorbackend.dto.AuditLogDto;
import com.example.billscalculatorbackend.dto.AuditLogFilterDto;
import com.example.billscalculatorbackend.model.LogCategory;
import com.example.billscalculatorbackend.model.RegistrationRequest;
import com.example.billscalculatorbackend.model.Role;
import com.example.billscalculatorbackend.model.User;
import com.example.billscalculatorbackend.repository.PasswordResetTokenRepository;
import com.example.billscalculatorbackend.repository.RegistrationRequestRepository;
import com.example.billscalculatorbackend.service.AuditService;
import com.example.billscalculatorbackend.service.IoService;
import com.example.billscalculatorbackend.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final RegistrationRequestRepository requestRepo;
    private final PasswordResetTokenRepository passwordResetTokenRepo;
    private final IoService ioService;
    private final AuditService auditService;
    private final PasswordEncoder encoder;

    @GetMapping("/users")
    public ResponseEntity<?> listUsers() {
        List<Map<String, Object>> result = userService.findAll().stream()
                .map(u -> Map.<String, Object>of(
                        "id", u.getId(),
                        "email", u.getEmail(),
                        "role", u.getRole() != null ? u.getRole().name() : "USER",
                        "enabled", u.isEnabled(),
                        "createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : ""
                ))
                .toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/requests")
    public ResponseEntity<?> listRequests() {
        return ResponseEntity.ok(requestRepo.findByStatusOrderByCreatedAtDesc("PENDING"));
    }

    @PostMapping("/requests/{id}/approve")
    @Audit(action = "ADMIN_APPROVE_REQUEST", entityType = "REGISTRATION_REQUEST", category = LogCategory.SECURITY)
    public ResponseEntity<?> approveRequest(@PathVariable Long id) {
        return requestRepo.findById(id).map(req -> {
            if (userService.existsByEmail(req.getEmail()))
                return ResponseEntity.badRequest().body("Email already exists");
            userService.create(req.getEmail(), req.getPasswordHash(), Role.USER);
            req.setStatus("APPROVED");
            requestRepo.save(req);
            return ResponseEntity.ok().body("Approved");
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/requests/{id}/reject")
    @Audit(action = "ADMIN_REJECT_REQUEST", entityType = "REGISTRATION_REQUEST", category = LogCategory.SECURITY)
    public ResponseEntity<?> rejectRequest(@PathVariable Long id) {
        return requestRepo.findById(id).map(req -> {
            req.setStatus("REJECTED");
            requestRepo.save(req);
            return ResponseEntity.ok().body("Rejected");
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/users/{id}")
    @Audit(action = "ADMIN_DELETE_USER", entityType = "USER", category = LogCategory.SECURITY)
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        return userService.findById(id).map(u -> {
            if (u.getRole() == Role.ADMIN)
                return ResponseEntity.badRequest().body("Cannot delete admin");
            ioService.clearAll(u);
            requestRepo.deleteByEmail(u.getEmail());
            passwordResetTokenRepo.deleteByEmail(u.getEmail());
            userService.deleteById(id);
            return ResponseEntity.ok().body("Deleted");
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}/toggle")
    @Audit(action = "ADMIN_TOGGLE_USER", entityType = "USER", category = LogCategory.SECURITY)
    public ResponseEntity<?> toggleUser(@PathVariable Long id) {
        return userService.findById(id).map(u -> {
            if (u.getRole() == Role.ADMIN)
                return ResponseEntity.badRequest().body("Cannot disable admin");
            u.setEnabled(!u.isEnabled());
            userService.save(u);
            return ResponseEntity.ok().body(Map.of("enabled", u.isEnabled()));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/backup")
    @Audit(action = "ADMIN_BACKUP_DOWNLOAD", category = LogCategory.SECURITY)
    public ResponseEntity<byte[]> backup() {
        try {
            ObjectMapper mapper = new ObjectMapper();
            ArrayNode root = mapper.createArrayNode();

            for (User u : userService.findAll()) {
                ObjectNode node = mapper.createObjectNode();
                node.put("email", u.getEmail());
                node.put("passwordHash", u.getPassword());
                node.put("role", u.getRole() != null ? u.getRole().name() : "USER");
                node.put("enabled", u.isEnabled());
                node.set("data", mapper.readTree(ioService.exportJson(u)));
                root.add(node);
            }

            byte[] bytes = mapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(root);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"backup.json\"")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(bytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/restore")
    @Audit(action = "ADMIN_RESTORE", category = LogCategory.SECURITY)
    public ResponseEntity<?> restore(@RequestBody com.fasterxml.jackson.databind.JsonNode body) {
        if (!body.isArray()) return ResponseEntity.badRequest().body("Expected JSON array");

        ObjectMapper mapper = new ObjectMapper();
        int restored = 0, skipped = 0;

        for (com.fasterxml.jackson.databind.JsonNode entry : body) {
            String email = entry.path("email").asText("");
            com.fasterxml.jackson.databind.JsonNode dataNode = entry.get("data");
            if (email.trim().isEmpty() || dataNode == null) { skipped++; continue; }

            try {
                User user = userService.findByEmail(email);
                if (user == null) {
                    String passwordHash = entry.path("passwordHash").asText(null);
                    Role role;
                    try { role = Role.valueOf(entry.path("role").asText("USER")); } catch (Exception e) { role = Role.USER; }
                    boolean enabled = entry.path("enabled").asBoolean(true);
                    user = userService.createFull(email, passwordHash, role, enabled);
                }
                ioService.importJson(user, mapper.writeValueAsString(dataNode));
                requestRepo.deleteByEmail(email);
                restored++;
            } catch (Exception e) {
                skipped++;
            }
        }

        return ResponseEntity.ok(Map.of("restored", restored, "skipped", skipped));
    }

    // --- Audit log endpoints ---

    @GetMapping("/audit-logs")
    public ResponseEntity<Page<AuditLogDto>> getAuditLogs(
            @ModelAttribute AuditLogFilterDto filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());
        return ResponseEntity.ok(auditService.findAll(filter, pageable).map(AuditLogDto::from));
    }

    @DeleteMapping("/audit-logs/activity")
    public ResponseEntity<Void> clearActivityLogs() {
        auditService.deleteActivity();
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/audit-logs/all")
    public ResponseEntity<Void> clearAllLogs() {
        auditService.deleteAll();
        return ResponseEntity.noContent().build();
    }
}

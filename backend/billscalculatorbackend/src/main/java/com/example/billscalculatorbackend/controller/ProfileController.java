package com.example.billscalculatorbackend.controller;

import com.example.billscalculatorbackend.dto.ChangePasswordRequest;
import com.example.billscalculatorbackend.model.User;
import com.example.billscalculatorbackend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserService userService;
    private final PasswordEncoder encoder;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.findByEmail(email);
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        User u = currentUser();
        return ResponseEntity.ok(Map.of(
                "email", u.getEmail(),
                "role", u.getRole() != null ? u.getRole().name() : "USER",
                "createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : ""
        ));
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest req) {
        User u = currentUser();
        if (!encoder.matches(req.getOldPassword(), u.getPassword()))
            return ResponseEntity.badRequest().body("Incorrect current password");
        if (req.getNewPassword() == null || req.getNewPassword().length() < 6)
            return ResponseEntity.badRequest().body("New password must be at least 6 characters");
        u.setPassword(encoder.encode(req.getNewPassword()));
        userService.save(u);
        return ResponseEntity.ok().body("Password changed");
    }
}

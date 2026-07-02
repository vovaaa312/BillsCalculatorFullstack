package com.example.billscalculatorbackend.controller;

import com.example.billscalculatorbackend.config.JwtService;
import com.example.billscalculatorbackend.dto.JwtResponse;
import com.example.billscalculatorbackend.dto.LoginRequest;
import com.example.billscalculatorbackend.dto.RegisterRequest;
import com.example.billscalculatorbackend.dto.ResetPasswordRequest;
import com.example.billscalculatorbackend.model.LogCategory;
import com.example.billscalculatorbackend.model.PasswordResetToken;
import com.example.billscalculatorbackend.model.RegistrationRequest;
import com.example.billscalculatorbackend.model.User;
import com.example.billscalculatorbackend.repository.PasswordResetTokenRepository;
import com.example.billscalculatorbackend.repository.RegistrationRequestRepository;
import com.example.billscalculatorbackend.service.AuditService;
import com.example.billscalculatorbackend.service.EmailService;
import com.example.billscalculatorbackend.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;
    private final PasswordEncoder encoder;
    private final RegistrationRequestRepository requestRepo;
    private final PasswordResetTokenRepository resetTokenRepo;
    private final EmailService emailService;
    private final AuditService auditService;

    @Value("${google.client-id:}")
    private String googleClientId;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req, HttpServletRequest request) {
        if (userService.existsByEmail(req.getEmail()))
            return ResponseEntity.badRequest().body("Email already registered");
        if (requestRepo.existsByEmailAndStatus(req.getEmail(), "PENDING"))
            return ResponseEntity.badRequest().body("Registration request already pending");

        requestRepo.deleteByEmail(req.getEmail());

        RegistrationRequest regReq = new RegistrationRequest();
        regReq.setEmail(req.getEmail());
        regReq.setPasswordHash(encoder.encode(req.getPassword()));
        regReq.setStatus("PENDING");
        requestRepo.save(regReq);

        auditService.log(req.getEmail(), "REGISTER_REQUEST", null, null,
                "SUCCESS", getClientIp(request), null, LogCategory.SECURITY);

        return ResponseEntity.accepted().body("Registration request submitted. Waiting for admin approval.");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req, HttpServletRequest request) {
        String ip = getClientIp(request);
        User user = userService.findByEmail(req.getEmail());
        if (user == null || !encoder.matches(req.getPassword(), user.getPassword())) {
            auditService.log(req.getEmail(), "LOGIN_FAILURE", null, null,
                    "FAILURE", ip, "Invalid credentials", LogCategory.SECURITY);
            return ResponseEntity.status(401).body("Invalid credentials");
        }
        if (!user.isEnabled()) {
            auditService.log(req.getEmail(), "LOGIN_FAILURE", null, null,
                    "FAILURE", ip, "Account disabled", LogCategory.SECURITY);
            return ResponseEntity.status(403).body("Account disabled");
        }
        String role = user.getRole() != null ? user.getRole().name() : "USER";
        String token = jwtService.generateToken(user.getEmail(), role);
        auditService.log(req.getEmail(), "LOGIN_SUCCESS", null, null,
                "SUCCESS", ip, null, LogCategory.SECURITY);
        return ResponseEntity.ok(new JwtResponse(token, user.getEmail(), role));
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String idToken = body.get("idToken");
        if (idToken == null || idToken.trim().isEmpty())
            return ResponseEntity.badRequest().body("Missing idToken");
        String ip = getClientIp(request);
        try {
            RestTemplate rt = new RestTemplate();
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;
            Map<?, ?> info = rt.getForObject(url, Map.class);

            if (info == null) return ResponseEntity.status(401).body("Invalid Google token");

            String aud = (String) info.get("aud");
            if (!googleClientId.trim().isEmpty() && !googleClientId.equals(aud))
                return ResponseEntity.status(401).body("Token audience mismatch");

            String emailVerified = (String) info.get("email_verified");
            if (!"true".equals(emailVerified))
                return ResponseEntity.badRequest().body("Google email not verified");

            String email = (String) info.get("email");
            User user = userService.findByEmail(email);

            if (user == null) {
                if (!requestRepo.existsByEmailAndStatus(email, "PENDING")) {
                    requestRepo.deleteByEmail(email);
                    RegistrationRequest regReq = new RegistrationRequest();
                    regReq.setEmail(email);
                    regReq.setPasswordHash("");
                    regReq.setStatus("PENDING");
                    requestRepo.save(regReq);
                    auditService.log(email, "REGISTER_REQUEST", null, null,
                            "SUCCESS", ip, "via Google", LogCategory.SECURITY);
                }
                return ResponseEntity.status(403).body("Account pending");
            }

            if (!user.isEnabled())
                return ResponseEntity.status(403).body("Account disabled");

            String role = user.getRole() != null ? user.getRole().name() : "USER";
            String token = jwtService.generateToken(email, role);
            auditService.log(email, "GOOGLE_LOGIN", null, null,
                    "SUCCESS", ip, null, LogCategory.SECURITY);
            return ResponseEntity.ok(new JwtResponse(token, email, role));
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Invalid Google token");
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String email = body.get("email");
        if (email == null || email.trim().isEmpty())
            return ResponseEntity.badRequest().body("Email required");

        // Always return OK to avoid email enumeration
        if (!userService.existsByEmail(email))
            return ResponseEntity.ok().body("If this email is registered you will receive a reset link.");

        resetTokenRepo.deleteByEmail(email);

        PasswordResetToken prt = new PasswordResetToken();
        prt.setToken(UUID.randomUUID().toString());
        prt.setEmail(email);
        prt.setExpiresAt(LocalDateTime.now().plusHours(1));
        resetTokenRepo.save(prt);

        emailService.sendPasswordReset(email, prt.getToken());
        auditService.log(email, "PASSWORD_RESET_REQUEST", null, null,
                "SUCCESS", getClientIp(request), null, LogCategory.SECURITY);
        return ResponseEntity.ok().body("Reset link sent.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest req, HttpServletRequest request) {
        String ip = getClientIp(request);
        return resetTokenRepo.findByToken(req.getToken()).map(prt -> {
            if (prt.getExpiresAt().isBefore(LocalDateTime.now())) {
                resetTokenRepo.delete(prt);
                return ResponseEntity.badRequest().body("Token expired");
            }
            if (req.getNewPassword() == null || req.getNewPassword().length() < 6)
                return ResponseEntity.badRequest().body("Password too short");
            User user = userService.findByEmail(prt.getEmail());
            if (user == null)
                return ResponseEntity.badRequest().body("User not found");
            user.setPassword(encoder.encode(req.getNewPassword()));
            userService.save(user);
            resetTokenRepo.delete(prt);
            auditService.log(prt.getEmail(), "PASSWORD_RESET_COMPLETE", null, null,
                    "SUCCESS", ip, null, LogCategory.SECURITY);
            return ResponseEntity.ok().body("Password reset successfully");
        }).orElse(ResponseEntity.badRequest().body("Invalid or expired token"));
    }

    private static String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Real-IP");
        return (ip != null && !ip.trim().isEmpty()) ? ip : request.getRemoteAddr();
    }
}

package com.example.billscalculatorbackend.controller;

import com.example.billscalculatorbackend.config.JwtService;
import com.example.billscalculatorbackend.dto.JwtResponse;
import com.example.billscalculatorbackend.dto.LoginRequest;
import com.example.billscalculatorbackend.dto.RegisterRequest;
import com.example.billscalculatorbackend.model.RegistrationRequest;
import com.example.billscalculatorbackend.model.User;
import com.example.billscalculatorbackend.repository.RegistrationRequestRepository;
import com.example.billscalculatorbackend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;
    private final PasswordEncoder encoder;
    private final RegistrationRequestRepository requestRepo;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (userService.existsByEmail(req.getEmail()))
            return ResponseEntity.badRequest().body("Email already registered");
        if (requestRepo.existsByEmail(req.getEmail()))
            return ResponseEntity.badRequest().body("Registration request already pending");

        RegistrationRequest regReq = new RegistrationRequest();
        regReq.setEmail(req.getEmail());
        regReq.setPasswordHash(encoder.encode(req.getPassword()));
        regReq.setStatus("PENDING");
        requestRepo.save(regReq);

        return ResponseEntity.accepted().body("Registration request submitted. Waiting for admin approval.");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        User user = userService.findByEmail(req.getEmail());
        if (user == null || !encoder.matches(req.getPassword(), user.getPassword()))
            return ResponseEntity.status(401).body("Invalid credentials");
        if (!user.isEnabled())
            return ResponseEntity.status(403).body("Account disabled");
        String role = user.getRole() != null ? user.getRole().name() : "USER";
        String token = jwtService.generateToken(user.getEmail(), role);
        return ResponseEntity.ok(new JwtResponse(token, user.getEmail(), role));
    }
}

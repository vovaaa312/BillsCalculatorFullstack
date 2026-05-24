package com.example.billscalculatorbackend.controller;

import com.example.billscalculatorbackend.config.JwtService;
import com.example.billscalculatorbackend.dto.JwtResponse;
import com.example.billscalculatorbackend.dto.LoginRequest;
import com.example.billscalculatorbackend.dto.RegisterRequest;
import com.example.billscalculatorbackend.model.User;
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

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (userService.existsByEmail(req.getEmail()))
            return ResponseEntity.badRequest().body("Email already registered");
        User user = userService.create(req.getEmail(), encoder.encode(req.getPassword()));
        String token = jwtService.generateToken(user.getEmail());
        return ResponseEntity.ok(new JwtResponse(token, user.getEmail()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        User user = userService.findByEmail(req.getEmail());
        if (user == null || !encoder.matches(req.getPassword(), user.getPassword()))
            return ResponseEntity.status(401).body("Invalid credentials");
        return ResponseEntity.ok(new JwtResponse(jwtService.generateToken(user.getEmail()), user.getEmail()));
    }
}

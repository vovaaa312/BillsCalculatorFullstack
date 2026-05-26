package com.example.billscalculatorbackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.base-url}")
    private String baseUrl;

    @Value("${spring.mail.username}")
    private String from;

    public void sendPasswordReset(String to, String token) {
        String link = baseUrl + "/reset-password?token=" + token;
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(from);
        msg.setTo(to);
        msg.setSubject("Password reset — Bills Calculator");
        msg.setText("Click the link below to reset your password (valid 1 hour):\n\n" + link
                + "\n\nIf you did not request this, ignore this email.");
        mailSender.send(msg);
    }
}

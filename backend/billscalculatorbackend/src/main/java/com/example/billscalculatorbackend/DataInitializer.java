package com.example.billscalculatorbackend;

import com.example.billscalculatorbackend.model.Role;
import com.example.billscalculatorbackend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserService userService;
    private final PasswordEncoder encoder;

    @Override
    public void run(ApplicationArguments args) {
        if (!userService.existsByEmail("admin@mail.com")) {
            userService.create("admin@mail.com", encoder.encode("admin"), Role.ADMIN);
        }
    }
}

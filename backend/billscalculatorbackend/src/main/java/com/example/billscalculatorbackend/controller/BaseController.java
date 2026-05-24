package com.example.billscalculatorbackend.controller;

import com.example.billscalculatorbackend.model.User;
import com.example.billscalculatorbackend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;

@RequiredArgsConstructor
public abstract class BaseController {

    protected final UserService userService;

    protected User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.findByEmail(email);
    }
}

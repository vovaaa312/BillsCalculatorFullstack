package com.example.billscalculatorbackend.service;

import com.example.billscalculatorbackend.model.Role;
import com.example.billscalculatorbackend.model.User;
import com.example.billscalculatorbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User findByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public User create(String email, String encodedPassword, Role role) {
        User user = new User();
        user.setEmail(email);
        user.setPassword(encodedPassword);
        user.setRole(role);
        user.setEnabled(true);
        return userRepository.save(user);
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public void deleteById(Long id) {
        userRepository.deleteById(id);
    }

    public User save(User user) {
        return userRepository.save(user);
    }
}

package com.example.billscalculatorbackend.repository;

import com.example.billscalculatorbackend.model.Hotovost;
import com.example.billscalculatorbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HotovostRepository extends JpaRepository<Hotovost, Long> {
    Optional<Hotovost> findByUser(User user);
    void deleteByUser(User user);
}

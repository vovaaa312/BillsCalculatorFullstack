package com.example.billscalculatorbackend.repository;

import com.example.billscalculatorbackend.model.Cash;
import com.example.billscalculatorbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CashRepository extends JpaRepository<Cash, Long> {
    Optional<Cash> findByUser(User user);
    void deleteByUser(User user);
}

package com.example.billscalculatorbackend.repository;

import com.example.billscalculatorbackend.model.User;
import com.example.billscalculatorbackend.model.Vydaj;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VydajRepository extends JpaRepository<Vydaj, Long> {
    List<Vydaj> findByUser(User user);
    void deleteByUser(User user);
}

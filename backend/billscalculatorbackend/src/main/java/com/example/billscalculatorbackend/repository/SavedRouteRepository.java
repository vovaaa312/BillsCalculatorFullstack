package com.example.billscalculatorbackend.repository;

import com.example.billscalculatorbackend.model.SavedRoute;
import com.example.billscalculatorbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SavedRouteRepository extends JpaRepository<SavedRoute, Long> {
    List<SavedRoute> findByUserOrderByCreatedAtDesc(User user);
}

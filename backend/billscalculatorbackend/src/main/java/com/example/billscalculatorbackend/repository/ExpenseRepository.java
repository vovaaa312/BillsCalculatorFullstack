package com.example.billscalculatorbackend.repository;

import com.example.billscalculatorbackend.model.Expense;
import com.example.billscalculatorbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByUser(User user);
    void deleteByUser(User user);
}

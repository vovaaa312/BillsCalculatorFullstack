package com.example.billscalculatorbackend.service;

import com.example.billscalculatorbackend.model.Expense;
import com.example.billscalculatorbackend.model.User;
import com.example.billscalculatorbackend.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepo;

    public List<Expense> getAll(User user) {
        return expenseRepo.findByUser(user);
    }

    @Transactional
    public Expense create(User user, Expense expense) {
        expense.setId(null);
        expense.setUser(user);
        return expenseRepo.save(expense);
    }

    @Transactional
    public Expense update(User user, Long id, Expense updated) {
        Expense existing = expenseRepo.findById(id)
                .filter(v -> v.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        existing.setName(updated.getName());
        existing.setAmount(updated.getAmount());
        existing.setDate(updated.getDate());
        return expenseRepo.save(existing);
    }

    @Transactional
    public void delete(User user, Long id) {
        expenseRepo.findById(id)
                .filter(v -> v.getUser().getId().equals(user.getId()))
                .ifPresent(expenseRepo::delete);
    }
}

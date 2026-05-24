package com.example.billscalculatorbackend.controller;

import com.example.billscalculatorbackend.model.Expense;
import com.example.billscalculatorbackend.service.ExpenseService;
import com.example.billscalculatorbackend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController extends BaseController {

    private final ExpenseService expenseService;

    public ExpenseController(UserService userService, ExpenseService expenseService) {
        super(userService);
        this.expenseService = expenseService;
    }

    @GetMapping
    public List<Expense> getAll() {
        return expenseService.getAll(currentUser());
    }

    @PostMapping
    public ResponseEntity<Expense> create(@RequestBody Expense expense) {
        return ResponseEntity.status(201).body(expenseService.create(currentUser(), expense));
    }

    @PutMapping("/{id}")
    public Expense update(@PathVariable Long id, @RequestBody Expense expense) {
        return expenseService.update(currentUser(), id, expense);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        expenseService.delete(currentUser(), id);
        return ResponseEntity.noContent().build();
    }
}

package com.example.billscalculatorbackend.controller;

import com.example.billscalculatorbackend.annotation.Audit;
import com.example.billscalculatorbackend.model.Cash;
import com.example.billscalculatorbackend.service.CashService;
import com.example.billscalculatorbackend.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cash")
public class CashController extends BaseController {

    private final CashService cashService;

    public CashController(UserService userService, CashService cashService) {
        super(userService);
        this.cashService = cashService;
    }

    @GetMapping
    public Cash get() {
        return cashService.get(currentUser());
    }

    @PutMapping
    @Audit(action = "UPDATE_CASH", entityType = "CASH")
    public Cash update(@RequestBody Cash cash) {
        return cashService.update(currentUser(), cash);
    }
}

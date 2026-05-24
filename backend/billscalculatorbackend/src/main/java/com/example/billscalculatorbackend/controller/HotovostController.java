package com.example.billscalculatorbackend.controller;

import com.example.billscalculatorbackend.model.Hotovost;
import com.example.billscalculatorbackend.service.HotovostService;
import com.example.billscalculatorbackend.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hotovost")
public class HotovostController extends BaseController {

    private final HotovostService hotovostService;

    public HotovostController(UserService userService, HotovostService hotovostService) {
        super(userService);
        this.hotovostService = hotovostService;
    }

    @GetMapping
    public Hotovost get() {
        return hotovostService.get(currentUser());
    }

    @PutMapping
    public Hotovost update(@RequestBody Hotovost hotovost) {
        return hotovostService.update(currentUser(), hotovost);
    }
}

package com.example.billscalculatorbackend.controller;

import com.example.billscalculatorbackend.model.Vydaj;
import com.example.billscalculatorbackend.service.UserService;
import com.example.billscalculatorbackend.service.VydajService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vydaje")
public class VydajController extends BaseController {

    private final VydajService vydajService;

    public VydajController(UserService userService, VydajService vydajService) {
        super(userService);
        this.vydajService = vydajService;
    }

    @GetMapping
    public List<Vydaj> getAll() {
        return vydajService.getAll(currentUser());
    }

    @PostMapping
    public ResponseEntity<Vydaj> create(@RequestBody Vydaj vydaj) {
        return ResponseEntity.status(201).body(vydajService.create(currentUser(), vydaj));
    }

    @PutMapping("/{id}")
    public Vydaj update(@PathVariable Long id, @RequestBody Vydaj vydaj) {
        return vydajService.update(currentUser(), id, vydaj);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        vydajService.delete(currentUser(), id);
        return ResponseEntity.noContent().build();
    }
}

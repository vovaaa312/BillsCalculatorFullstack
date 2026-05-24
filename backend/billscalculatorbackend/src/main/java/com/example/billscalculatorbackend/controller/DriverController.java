package com.example.billscalculatorbackend.controller;

import com.example.billscalculatorbackend.dto.DriverFilterDto;
import com.example.billscalculatorbackend.model.DriverShift;
import com.example.billscalculatorbackend.service.DriverService;
import com.example.billscalculatorbackend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/driver")
public class DriverController extends BaseController {

    private final DriverService driverService;

    public DriverController(UserService userService, DriverService driverService) {
        super(userService);
        this.driverService = driverService;
    }

    @GetMapping
    public List<DriverShift> getAll(@ModelAttribute DriverFilterDto filter) {
        return filter.isEmpty()
                ? driverService.getAll(currentUser())
                : driverService.getFiltered(currentUser(), filter);
    }

    @PostMapping
    public ResponseEntity<DriverShift> create(@RequestBody DriverShift shift) {
        return ResponseEntity.status(201).body(driverService.create(currentUser(), shift));
    }

    @PutMapping("/{id}")
    public DriverShift update(@PathVariable Long id, @RequestBody DriverShift shift) {
        return driverService.update(currentUser(), id, shift);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        driverService.delete(currentUser(), id);
        return ResponseEntity.noContent().build();
    }
}

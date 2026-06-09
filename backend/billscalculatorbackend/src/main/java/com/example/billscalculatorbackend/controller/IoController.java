package com.example.billscalculatorbackend.controller;

import com.example.billscalculatorbackend.service.IoService;
import com.example.billscalculatorbackend.service.UserService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/io")
public class IoController extends BaseController {

    private final IoService ioService;

    public IoController(UserService userService, IoService ioService) {
        super(userService);
        this.ioService = ioService;
    }

    @GetMapping("/export")
    public ResponseEntity<String> export() {
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=data.json")
                .contentType(MediaType.APPLICATION_JSON)
                .body(ioService.exportJson(currentUser()));
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> importData(@RequestParam("file") MultipartFile file) throws Exception {
        String json = new String(file.getBytes(), StandardCharsets.UTF_8);
        ioService.importJson(currentUser(), json);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/clear")
    public ResponseEntity<Void> clear() {
        ioService.clearAll(currentUser());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/clear-invoices")
    public ResponseEntity<Void> clearInvoices() {
        ioService.clearInvoices(currentUser());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/clear-expenses")
    public ResponseEntity<Void> clearExpenses() {
        ioService.clearExpenses(currentUser());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/clear-drivers")
    public ResponseEntity<Void> clearDrivers() {
        ioService.clearDriverShifts(currentUser());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/clear-cash")
    public ResponseEntity<Void> clearCash() {
        ioService.clearCash(currentUser());
        return ResponseEntity.noContent().build();
    }
}

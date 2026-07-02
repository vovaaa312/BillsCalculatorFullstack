package com.example.billscalculatorbackend.controller;

import com.example.billscalculatorbackend.annotation.Audit;
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
    @Audit(action = "EXPORT_DATA")
    public ResponseEntity<String> export() {
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=data.json")
                .contentType(MediaType.APPLICATION_JSON)
                .body(ioService.exportJson(currentUser()));
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Audit(action = "IMPORT_DATA")
    public ResponseEntity<Void> importData(@RequestParam("file") MultipartFile file) throws Exception {
        String json = new String(file.getBytes(), StandardCharsets.UTF_8);
        ioService.importJson(currentUser(), json);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/clear")
    @Audit(action = "CLEAR_ALL_DATA")
    public ResponseEntity<Void> clear() {
        ioService.clearAll(currentUser());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/clear-invoices")
    @Audit(action = "CLEAR_INVOICES")
    public ResponseEntity<Void> clearInvoices() {
        ioService.clearInvoices(currentUser());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/clear-expenses")
    @Audit(action = "CLEAR_EXPENSES")
    public ResponseEntity<Void> clearExpenses() {
        ioService.clearExpenses(currentUser());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/clear-drivers")
    @Audit(action = "CLEAR_DRIVERS")
    public ResponseEntity<Void> clearDrivers() {
        ioService.clearDriverShifts(currentUser());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/clear-cash")
    @Audit(action = "CLEAR_CASH")
    public ResponseEntity<Void> clearCash() {
        ioService.clearCash(currentUser());
        return ResponseEntity.noContent().build();
    }
}

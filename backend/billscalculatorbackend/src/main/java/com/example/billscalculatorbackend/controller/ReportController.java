package com.example.billscalculatorbackend.controller;

import com.example.billscalculatorbackend.service.ReportService;
import com.example.billscalculatorbackend.service.UserService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/report")
public class ReportController extends BaseController {

    private final ReportService reportService;

    public ReportController(UserService userService, ReportService reportService) {
        super(userService);
        this.reportService = reportService;
    }

    @GetMapping("/text")
    public ResponseEntity<String> getText(@RequestParam(defaultValue = "cs") String lang) {
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .body(reportService.buildText(currentUser(), lang));
    }

    @GetMapping("/pdf")
    public ResponseEntity<byte[]> getPdf(@RequestParam(defaultValue = "cs") String lang) throws Exception {
        byte[] pdf = reportService.buildPdf(currentUser(), lang);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=report.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}

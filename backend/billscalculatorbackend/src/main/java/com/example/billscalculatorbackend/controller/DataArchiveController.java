package com.example.billscalculatorbackend.controller;

import com.example.billscalculatorbackend.model.DataArchive;
import com.example.billscalculatorbackend.service.DataArchiveService;
import com.example.billscalculatorbackend.service.UserService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/archives")
public class DataArchiveController extends BaseController {

    private final DataArchiveService archiveService;

    public DataArchiveController(UserService userService, DataArchiveService archiveService) {
        super(userService);
        this.archiveService = archiveService;
    }

    @GetMapping
    public List<DataArchive> getAll() {
        return archiveService.getAll(currentUser());
    }

    @PostMapping
    public ResponseEntity<DataArchive> create(@RequestBody Map<String, String> body) {
        return ResponseEntity.status(201).body(archiveService.create(currentUser(), body.get("name")));
    }

    @GetMapping("/{id}")
    public DataArchiveService.ArchiveDetail getDetail(@PathVariable Long id) {
        return archiveService.getDetail(currentUser(), id);
    }

    @GetMapping(value = "/{id}/report", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> getReport(@PathVariable Long id,
                                             @RequestParam(defaultValue = "cs") String lang) throws Exception {
        byte[] pdf = archiveService.getReport(currentUser(), id, lang);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=archive-report.pdf")
                .body(pdf);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        archiveService.delete(currentUser(), id);
        return ResponseEntity.noContent().build();
    }
}

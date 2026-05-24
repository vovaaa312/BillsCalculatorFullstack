package com.example.billscalculatorbackend.controller;

import com.example.billscalculatorbackend.dto.FakturaFilterDto;
import com.example.billscalculatorbackend.model.Faktura;
import com.example.billscalculatorbackend.service.FakturaService;
import com.example.billscalculatorbackend.service.PdfParserService;
import com.example.billscalculatorbackend.service.UserService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/faktury")
public class FakturaController extends BaseController {

    private final FakturaService fakturaService;
    private final PdfParserService pdfParserService;

    public FakturaController(UserService userService, FakturaService fakturaService, PdfParserService pdfParserService) {
        super(userService);
        this.fakturaService = fakturaService;
        this.pdfParserService = pdfParserService;
    }

    @GetMapping
    public List<Faktura> getAll(@ModelAttribute FakturaFilterDto filter) {
        return filter.isEmpty()
                ? fakturaService.getAll(currentUser())
                : fakturaService.getFiltered(currentUser(), filter);
    }

    @PostMapping
    public ResponseEntity<Faktura> create(@RequestBody Faktura faktura) {
        return ResponseEntity.status(201).body(fakturaService.create(currentUser(), faktura));
    }

    @PutMapping("/{id}")
    public Faktura update(@PathVariable Long id, @RequestBody Faktura faktura) {
        return fakturaService.update(currentUser(), id, faktura);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        fakturaService.delete(currentUser(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/import-pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<Faktura>> importPdf(@RequestParam("file") MultipartFile file) throws Exception {
        List<Faktura> parsed = pdfParserService.parseUpload(file);
        List<Faktura> saved  = parsed.stream()
                .map(f -> fakturaService.create(currentUser(), f))
                .toList();
        return ResponseEntity.ok(saved);
    }
}

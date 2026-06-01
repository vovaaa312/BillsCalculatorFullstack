package com.example.billscalculatorbackend.controller;

import com.example.billscalculatorbackend.dto.InvoiceFilterDto;
import com.example.billscalculatorbackend.model.Invoice;
import com.example.billscalculatorbackend.service.InvoiceService;
import com.example.billscalculatorbackend.service.PdfParserService;
import com.example.billscalculatorbackend.service.UserService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController extends BaseController {

    private final InvoiceService invoiceService;
    private final PdfParserService pdfParserService;

    public InvoiceController(UserService userService, InvoiceService invoiceService, PdfParserService pdfParserService) {
        super(userService);
        this.invoiceService = invoiceService;
        this.pdfParserService = pdfParserService;
    }

    @GetMapping
    public List<Invoice> getAll(@ModelAttribute InvoiceFilterDto filter) {
        return filter.isEmpty()
                ? invoiceService.getAll(currentUser())
                : invoiceService.getFiltered(currentUser(), filter);
    }

    @PostMapping
    public ResponseEntity<Invoice> create(@RequestBody Invoice invoice) {
        return ResponseEntity.status(201).body(invoiceService.create(currentUser(), invoice));
    }

    @PutMapping("/{id}")
    public Invoice update(@PathVariable Long id, @RequestBody Invoice invoice) {
        return invoiceService.update(currentUser(), id, invoice);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        invoiceService.delete(currentUser(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/import-pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<Invoice>> importPdf(@RequestParam("file") MultipartFile file) throws Exception {
        byte[] pdfBytes = file.getBytes();
        List<Invoice> parsed = pdfParserService.parseUpload(file);
        List<Invoice> saved = parsed.stream()
                .map(f -> invoiceService.createWithPdf(currentUser(), f, pdfBytes))
                .toList();
        return ResponseEntity.ok(saved);
    }

    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> getPdf(@PathVariable Long id) {
        return invoiceService.getPdfData(currentUser(), id)
                .map(data -> ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"invoice-" + id + ".pdf\"")
                        .body(data))
                .orElse(ResponseEntity.notFound().build());
    }
}

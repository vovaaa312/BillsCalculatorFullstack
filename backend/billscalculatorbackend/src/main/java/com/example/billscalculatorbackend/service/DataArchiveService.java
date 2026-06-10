package com.example.billscalculatorbackend.service;

import com.example.billscalculatorbackend.model.*;
import com.example.billscalculatorbackend.repository.*;
import com.example.billscalculatorbackend.util.JsonIO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DataArchiveService {

    private final DataArchiveRepository  repo;
    private final ArchivePdfRepository   archivePdfRepo;
    private final InvoiceRepository      invoiceRepo;
    private final InvoicePdfRepository   invoicePdfRepo;
    private final IoService              ioService;
    private final ReportService          reportService;

    public List<DataArchive> getAll(User user) {
        return repo.findByUserOrderByCreatedAtDesc(user);
    }

    @Transactional
    public DataArchive create(User user, String name) {
        String json = ioService.exportJson(user);

        DataArchive archive = new DataArchive();
        archive.setUser(user);
        archive.setName(name == null || name.isBlank()
                ? "Archiv " + LocalDateTime.now().toLocalDate()
                : name.trim());
        archive.setCreatedAt(LocalDateTime.now());
        archive.setDataJson(json);
        DataArchive saved = repo.save(archive);

        // Copy PDFs — stored once, fetched on demand per invoice click
        invoiceRepo.findByUserWithItems(user).stream()
                .filter(inv -> Boolean.TRUE.equals(inv.getHasPdf()))
                .forEach(inv -> invoicePdfRepo.findByInvoiceId(inv.getId()).ifPresent(pdf -> {
                    ArchivePdf ap = new ArchivePdf();
                    ap.setArchive(saved);
                    ap.setInvoiceId(inv.getId());
                    ap.setData(pdf.getData());
                    archivePdfRepo.save(ap);
                }));

        return saved;
    }

    public record ArchiveDetail(Long id, String name, LocalDateTime createdAt, String data) {}

    public ArchiveDetail getDetail(User user, Long id) {
        DataArchive archive = get(user, id);
        return new ArchiveDetail(archive.getId(), archive.getName(), archive.getCreatedAt(), archive.getDataJson());
    }

    public byte[] getReport(User user, Long id, String lang) throws Exception {
        DataArchive archive = get(user, id);
        AppData data = new AppData();
        JsonIO.deserialize(data, archive.getDataJson());
        return reportService.buildPdfFromData(data, lang);
    }

    public byte[] getPdf(User user, Long archiveId, Long invoiceId) {
        get(user, archiveId);
        return archivePdfRepo.findByArchiveIdAndInvoiceId(archiveId, invoiceId)
                .map(ArchivePdf::getData)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @Transactional
    public void delete(User user, Long id) {
        repo.findById(id)
                .filter(a -> a.getUser().getId().equals(user.getId()))
                .ifPresent(archive -> {
                    archivePdfRepo.deleteByArchiveId(id);
                    repo.delete(archive);
                });
    }

    private DataArchive get(User user, Long id) {
        return repo.findById(id)
                .filter(a -> a.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }
}

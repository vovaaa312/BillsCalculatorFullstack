package com.example.billscalculatorbackend.repository;

import com.example.billscalculatorbackend.model.ArchivePdf;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ArchivePdfRepository extends JpaRepository<ArchivePdf, Long> {
    Optional<ArchivePdf> findByArchiveIdAndInvoiceId(Long archiveId, Long invoiceId);
    void deleteByArchiveId(Long archiveId);
}

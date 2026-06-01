package com.example.billscalculatorbackend.repository;

import com.example.billscalculatorbackend.model.InvoicePdf;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InvoicePdfRepository extends JpaRepository<InvoicePdf, Long> {
    Optional<InvoicePdf> findByInvoiceId(Long invoiceId);
}

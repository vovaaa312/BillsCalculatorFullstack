package com.example.billscalculatorbackend.service;

import com.example.billscalculatorbackend.dto.InvoiceFilterDto;
import com.example.billscalculatorbackend.model.Invoice;
import com.example.billscalculatorbackend.model.User;
import com.example.billscalculatorbackend.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepo;

    public List<Invoice> getAll(User user) {
        return invoiceRepo.findByUserWithItems(user);
    }

    public List<Invoice> getFiltered(User user, InvoiceFilterDto filter) {
        return invoiceRepo.findFiltered(user,
                filter.getName(), filter.getPaymentType(), filter.getStatus(),
                filter.getDateFrom(), filter.getDateTo(),
                filter.getAmountMin(), filter.getAmountMax());
    }

    @Transactional
    public Invoice create(User user, Invoice invoice) {
        invoice.setId(null);
        invoice.setUser(user);
        invoice.getItems().forEach(p -> p.setInvoice(invoice));
        if (!invoice.getItems().isEmpty()) {
            invoice.recomputeAmountFromItems();
        }
        return invoiceRepo.save(invoice);
    }

    @Transactional
    public Invoice update(User user, Long id, Invoice updated) {
        Invoice existing = invoiceRepo.findById(id)
                .filter(f -> f.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        existing.setName(updated.getName());
        existing.setPaymentType(updated.getPaymentType());
        existing.setStatus(updated.getStatus());
        existing.setDate(updated.getDate());
        existing.getItems().clear();
        updated.getItems().forEach(p -> { p.setId(null); p.setInvoice(existing); existing.getItems().add(p); });
        if (existing.getItems().isEmpty()) existing.setAmount(updated.getAmount());
        else existing.recomputeAmountFromItems();
        return invoiceRepo.save(existing);
    }

    @Transactional
    public void delete(User user, Long id) {
        invoiceRepo.findById(id)
                .filter(f -> f.getUser().getId().equals(user.getId()))
                .ifPresent(invoiceRepo::delete);
    }
}

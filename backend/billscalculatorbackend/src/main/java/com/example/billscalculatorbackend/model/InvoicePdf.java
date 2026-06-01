package com.example.billscalculatorbackend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "invoice_pdfs")
@Getter
@Setter
@NoArgsConstructor
public class InvoicePdf {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", unique = true, nullable = false)
    @JsonIgnore
    private Invoice invoice;

    @Column(name = "data", nullable = false)
    private byte[] data;

    public InvoicePdf(Invoice invoice, byte[] data) {
        this.invoice = invoice;
        this.data = data;
    }
}

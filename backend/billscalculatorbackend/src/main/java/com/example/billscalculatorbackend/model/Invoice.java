package com.example.billscalculatorbackend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "faktury")
@Getter
@Setter
@NoArgsConstructor
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(name = "nazev", nullable = false)
    private String name;

    @Column(name = "castka")
    private int amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "typ_platby", nullable = false)
    private PaymentType paymentType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvoiceStatus status;

    @Column(name = "datum")
    private LocalDate date;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InvoiceItem> items = new ArrayList<>();

    @Column(name = "has_pdf")
    private Boolean hasPdf = false;

    public Invoice(String name, int amount, PaymentType paymentType, InvoiceStatus status, LocalDate date) {
        this.name = name;
        this.amount = amount;
        this.paymentType = paymentType;
        this.status = status;
        this.date = date;
    }

    public void recomputeAmountFromItems() {
        double sum = 0;
        for (InvoiceItem p : items) sum += p.getTotalPrice();
        this.amount = (int) Math.round(sum);
    }

    public int getTotalQuantity() {
        int sum = 0; for (InvoiceItem p : items) sum += p.getQuantity(); return sum;
    }

    public double getTotalPriceNoVat() {
        double sum = 0; for (InvoiceItem p : items) sum += p.getPrice(); return sum;
    }

    public double getTotalVat() {
        double sum = 0; for (InvoiceItem p : items) sum += p.getVatAmount(); return sum;
    }

    public double getTotalPrice() {
        double sum = 0; for (InvoiceItem p : items) sum += p.getTotalPrice(); return sum;
    }
}

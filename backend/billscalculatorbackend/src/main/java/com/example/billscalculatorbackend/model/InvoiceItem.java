package com.example.billscalculatorbackend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "polozky")
@Getter
@Setter
@NoArgsConstructor
public class InvoiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faktura_id", nullable = false)
    @JsonIgnore
    private Invoice invoice;

    @Column(name = "nazev")
    private String name = "";

    @Column(name = "mnozstvi")
    private int quantity = 1;

    @Column(name = "jcena")
    private double unitPrice = 0;

    @Column(name = "jcena_bez_dph")
    private double unitPriceNoVat = 0;

    @Column(name = "cena")
    private double price = 0;

    @Column(name = "dph_procent")
    private int vatPercent = 0;

    @Column(name = "dph_castka")
    private double vatAmount = 0;

    @Column(name = "kc_celkem")
    private double totalPrice = 0;

    public InvoiceItem(String name, int quantity, double unitPrice, double unitPriceNoVat,
                       double price, int vatPercent, double vatAmount, double totalPrice) {
        this.name = name;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.unitPriceNoVat = unitPriceNoVat;
        this.price = price;
        this.vatPercent = vatPercent;
        this.vatAmount = vatAmount;
        this.totalPrice = totalPrice;
    }
}

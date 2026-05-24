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
public class Polozka {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faktura_id", nullable = false)
    @JsonIgnore
    private Faktura faktura;

    private String nazev = "";
    private int mnozstvi = 1;
    private double jcena = 0;

    @Column(name = "jcena_bez_dph")
    private double jcenaBezDph = 0;

    private double cena = 0;

    @Column(name = "dph_procent")
    private int dphProcent = 0;

    @Column(name = "dph_castka")
    private double dphCastka = 0;

    @Column(name = "kc_celkem")
    private double kcCelkem = 0;

    public Polozka(String nazev, int mnozstvi, double jcena, double jcenaBezDph,
                   double cena, int dphProcent, double dphCastka, double kcCelkem) {
        this.nazev = nazev;
        this.mnozstvi = mnozstvi;
        this.jcena = jcena;
        this.jcenaBezDph = jcenaBezDph;
        this.cena = cena;
        this.dphProcent = dphProcent;
        this.dphCastka = dphCastka;
        this.kcCelkem = kcCelkem;
    }
}

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
public class Faktura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(nullable = false)
    private String nazev;

    private int castka;

    @Enumerated(EnumType.STRING)
    @Column(name = "typ_platby", nullable = false)
    private TypPlatby typPlatby;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusFaktury status;

    private LocalDate datum;

    @OneToMany(mappedBy = "faktura", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Polozka> polozky = new ArrayList<>();

    public Faktura(String nazev, int castka, TypPlatby typPlatby, StatusFaktury status, LocalDate datum) {
        this.nazev = nazev;
        this.castka = castka;
        this.typPlatby = typPlatby;
        this.status = status;
        this.datum = datum;
    }

    public void recomputeCastkaFromPolozky() {
        double sum = 0;
        for (Polozka p : polozky) sum += p.getKcCelkem();
        this.castka = (int) Math.round(sum);
    }

    public int getSoucetMnozstvi() {
        int sum = 0; for (Polozka p : polozky) sum += p.getMnozstvi(); return sum;
    }

    public double getSoucetCenaBezDph() {
        double sum = 0; for (Polozka p : polozky) sum += p.getCena(); return sum;
    }

    public double getSoucetDph() {
        double sum = 0; for (Polozka p : polozky) sum += p.getDphCastka(); return sum;
    }

    public double getSoucetKcCelkem() {
        double sum = 0; for (Polozka p : polozky) sum += p.getKcCelkem(); return sum;
    }
}

package com.example.billscalculatorbackend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "hotovost")
@Getter
@Setter
@NoArgsConstructor
public class Hotovost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    @JsonIgnore
    private User user;

    private int kusy5000 = 0;
    private int kusy2000 = 0;
    private int kusy1000 = 0;
    private int kusy500  = 0;
    private int kusy200  = 0;
    private int kusy100  = 0;
    private int mince    = 0;

    public int[] getNominals() { return new int[]{5000, 2000, 1000, 500, 200, 100}; }

    public int[] getCounts() {
        return new int[]{kusy5000, kusy2000, kusy1000, kusy500, kusy200, kusy100};
    }

    public int getTotal() {
        return kusy5000 * 5000 + kusy2000 * 2000 + kusy1000 * 1000
             + kusy500 * 500 + kusy200 * 200 + kusy100 * 100 + mince;
    }
}

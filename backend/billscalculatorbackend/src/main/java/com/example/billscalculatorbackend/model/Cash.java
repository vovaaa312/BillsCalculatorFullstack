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
public class Cash {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    @JsonIgnore
    private User user;

    @Column(name = "kusy5000") private int count5000 = 0;
    @Column(name = "kusy2000") private int count2000 = 0;
    @Column(name = "kusy1000") private int count1000 = 0;
    @Column(name = "kusy500")  private int count500  = 0;
    @Column(name = "kusy200")  private int count200  = 0;
    @Column(name = "kusy100")  private int count100  = 0;
    @Column(name = "kusy50")   private int count50   = 0;
    @Column(name = "kusy20")   private int count20   = 0;
    @Column(name = "kusy10")   private int count10   = 0;
    @Column(name = "kusy5")    private int count5    = 0;
    @Column(name = "kusy2")    private int count2    = 0;
    @Column(name = "kusy1")    private int count1    = 0;
    @Column(name = "mince")    private int mince     = 0;

    public int[] getNominals() { return new int[]{5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1}; }

    public int[] getCounts() {
        return new int[]{count5000, count2000, count1000, count500, count200, count100,
                         count50, count20, count10, count5, count2, count1};
    }

    public int getTotal() {
        return count5000 * 5000 + count2000 * 2000 + count1000 * 1000
             + count500 * 500 + count200 * 200 + count100 * 100
             + count50 * 50 + count20 * 20 + count10 * 10
             + count5 * 5 + count2 * 2 + count1;
    }
}

package com.example.billscalculatorbackend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "driver_shifts")
@Getter
@Setter
@NoArgsConstructor
public class DriverShift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(name = "driver_name", nullable = false)
    private String driverName;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime start;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime end;

    @Column(name = "km_start")
    private int kmStart = -1;

    @Column(name = "km_end")
    private int kmEnd = -1;

    @Column(name = "hourly_rate")
    private double hourlyRate = 0;

    public DriverShift(String driverName, LocalDateTime start, LocalDateTime end) {
        this.driverName = driverName;
        this.start = start;
        this.end = end;
    }

    public long getTotalMinutes() {
        if (start == null || end == null) return 0;
        return Math.max(0, ChronoUnit.MINUTES.between(start, end));
    }

    public double getTotalHours() { return getTotalMinutes() / 60.0; }

    public int getDrivenKm() {
        if (kmStart < 0 || kmEnd < 0) return -1;
        return Math.max(0, kmEnd - kmStart);
    }

    public double getEarnings() { return getTotalMinutes() / 60.0 * hourlyRate; }
}

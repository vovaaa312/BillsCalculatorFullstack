package com.example.billscalculatorbackend.dto;

import com.example.billscalculatorbackend.model.StatusFaktury;
import com.example.billscalculatorbackend.model.TypPlatby;
import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Getter
@Setter
public class FakturaFilterDto {
    private String nazev;
    private TypPlatby typPlatby;
    private StatusFaktury status;
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate dateFrom;
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate dateTo;
    private Integer amountMin;
    private Integer amountMax;

    public boolean isEmpty() {
        return nazev == null && typPlatby == null && status == null
            && dateFrom == null && dateTo == null
            && amountMin == null && amountMax == null;
    }
}

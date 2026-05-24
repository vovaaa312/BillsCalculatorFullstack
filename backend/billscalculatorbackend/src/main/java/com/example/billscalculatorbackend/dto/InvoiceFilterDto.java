package com.example.billscalculatorbackend.dto;

import com.example.billscalculatorbackend.model.InvoiceStatus;
import com.example.billscalculatorbackend.model.PaymentType;
import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Getter
@Setter
public class InvoiceFilterDto {
    private String name;
    private PaymentType paymentType;
    private InvoiceStatus status;
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate dateFrom;
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate dateTo;
    private Integer amountMin;
    private Integer amountMax;

    public boolean isEmpty() {
        return name == null && paymentType == null && status == null
            && dateFrom == null && dateTo == null
            && amountMin == null && amountMax == null;
    }
}

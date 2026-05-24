package com.example.billscalculatorbackend.model;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class AppData {

    private List<Invoice>     invoices     = new ArrayList<>();
    private List<Expense>     expenses     = new ArrayList<>();
    private List<DriverShift> driverShifts = new ArrayList<>();
    private Cash              cash         = new Cash();

    public int getInvoiceTotal() {
        int sum = 0;
        for (Invoice f : invoices) sum += f.getAmount();
        return sum;
    }

    public int getTransferTotal() {
        int sum = 0;
        for (Invoice f : invoices)
            if (f.getPaymentType() == PaymentType.PREVOD && f.getStatus() == InvoiceStatus.SPLNENA)
                sum += f.getAmount();
        return sum;
    }

    public int getCashInvoiceTotal() {
        int sum = 0;
        for (Invoice f : invoices)
            if (f.getPaymentType() == PaymentType.HOTOVOST && f.getStatus() == InvoiceStatus.SPLNENA)
                sum += f.getAmount();
        return sum;
    }

    public int getUnpaidTotal() {
        int sum = 0;
        for (Invoice f : invoices)
            if (f.getStatus() == InvoiceStatus.NESPLNENA)
                sum += f.getAmount();
        return sum;
    }

    public int getExpenseTotal() {
        int sum = 0;
        for (Expense v : expenses) sum += v.getAmount();
        return sum;
    }

    public int getExpectedCash() {
        return getCashInvoiceTotal() - getExpenseTotal();
    }

    public int getCashDifference() {
        return cash.getTotal() - getExpectedCash();
    }

    public void notifyChanged() {}
}

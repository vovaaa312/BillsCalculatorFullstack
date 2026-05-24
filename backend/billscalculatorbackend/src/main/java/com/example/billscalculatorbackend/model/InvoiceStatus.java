package com.example.billscalculatorbackend.model;

public enum InvoiceStatus {
    SPLNENA, NESPLNENA;

    public String i18nKey() { return "status." + name(); }
}

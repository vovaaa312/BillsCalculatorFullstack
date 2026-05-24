package com.example.billscalculatorbackend.model;

public enum PaymentType {
    HOTOVOST, PREVOD;

    public String i18nKey() { return "typ." + name(); }
}

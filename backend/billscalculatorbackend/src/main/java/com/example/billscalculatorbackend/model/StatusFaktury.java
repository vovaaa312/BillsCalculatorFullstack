package com.example.billscalculatorbackend.model;

public enum StatusFaktury {
    SPLNENA, NESPLNENA;

    public String i18nKey() { return "status." + name(); }
}

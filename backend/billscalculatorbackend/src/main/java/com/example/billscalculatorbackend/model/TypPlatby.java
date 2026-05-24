package com.example.billscalculatorbackend.model;

public enum TypPlatby {
    HOTOVOST, PREVOD;

    public String i18nKey() { return "typ." + name(); }
}

package com.example.billscalculatorbackend.model;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Non-JPA helper used to aggregate DB data for ReportBuilder.
 */
@Getter
@Setter
public class AppData {

    private List<Faktura>     faktury      = new ArrayList<>();
    private List<Vydaj>       vydaje       = new ArrayList<>();
    private List<DriverShift> driverShifts = new ArrayList<>();
    private Hotovost          hotovost     = new Hotovost();

    public int getTotalFaktury() {
        int sum = 0;
        for (Faktura f : faktury) sum += f.getCastka();
        return sum;
    }

    public int getTotalPrevodem() {
        int sum = 0;
        for (Faktura f : faktury)
            if (f.getTypPlatby() == TypPlatby.PREVOD && f.getStatus() == StatusFaktury.SPLNENA)
                sum += f.getCastka();
        return sum;
    }

    public int getTotalHotovostFaktury() {
        int sum = 0;
        for (Faktura f : faktury)
            if (f.getTypPlatby() == TypPlatby.HOTOVOST && f.getStatus() == StatusFaktury.SPLNENA)
                sum += f.getCastka();
        return sum;
    }

    public int getTotalNesplnene() {
        int sum = 0;
        for (Faktura f : faktury)
            if (f.getStatus() == StatusFaktury.NESPLNENA)
                sum += f.getCastka();
        return sum;
    }

    public int getTotalVydaje() {
        int sum = 0;
        for (Vydaj v : vydaje) sum += v.getCastka();
        return sum;
    }

    public int getOcekavanaHotovost() {
        return getTotalHotovostFaktury() - getTotalVydaje();
    }

    public int getRozdil() {
        return hotovost.getTotal() - getOcekavanaHotovost();
    }

    public void notifyChanged() {}
}

package com.example.billscalculatorbackend.service;

import com.example.billscalculatorbackend.model.*;
import com.example.billscalculatorbackend.repository.*;
import com.example.billscalculatorbackend.util.JsonIO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class IoService {

    private final FakturaRepository   fakturaRepo;
    private final VydajRepository     vydajRepo;
    private final DriverShiftRepository driverRepo;
    private final HotovostRepository  hotovostRepo;

    public AppData buildAppData(User user) {
        AppData data = new AppData();
        data.getFaktury().addAll(fakturaRepo.findByUserWithPolozky(user));
        data.getVydaje().addAll(vydajRepo.findByUser(user));
        data.getDriverShifts().addAll(driverRepo.findByUserOrderByStartDesc(user));
        hotovostRepo.findByUser(user).ifPresent(data::setHotovost);
        return data;
    }

    public String exportJson(User user) {
        return JsonIO.serialize(buildAppData(user));
    }

    @Transactional
    public void importJson(User user, String json) {
        AppData data = new AppData();
        JsonIO.deserialize(data, json);
        replaceAllData(user, data);
    }

    @Transactional
    public void replaceAllData(User user, AppData data) {
        clearAll(user);
        data.getFaktury().forEach(f -> {
            f.setId(null);
            f.setUser(user);
            f.getPolozky().forEach(p -> { p.setId(null); p.setFaktura(f); });
            fakturaRepo.save(f);
        });
        data.getVydaje().forEach(v -> { v.setId(null); v.setUser(user); vydajRepo.save(v); });
        data.getDriverShifts().forEach(d -> { d.setId(null); d.setUser(user); driverRepo.save(d); });
        if (data.getHotovost() != null) {
            Hotovost h = hotovostRepo.findByUser(user).orElse(new Hotovost());
            h.setUser(user);
            h.setKusy5000(data.getHotovost().getKusy5000());
            h.setKusy2000(data.getHotovost().getKusy2000());
            h.setKusy1000(data.getHotovost().getKusy1000());
            h.setKusy500(data.getHotovost().getKusy500());
            h.setKusy200(data.getHotovost().getKusy200());
            h.setKusy100(data.getHotovost().getKusy100());
            h.setMince(data.getHotovost().getMince());
            hotovostRepo.save(h);
        }
    }

    @Transactional
    public void clearAll(User user) {
        fakturaRepo.deleteByUser(user);
        vydajRepo.deleteByUser(user);
        driverRepo.deleteByUser(user);
        hotovostRepo.deleteByUser(user);
    }
}

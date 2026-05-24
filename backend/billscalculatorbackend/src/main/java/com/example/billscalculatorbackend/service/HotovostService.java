package com.example.billscalculatorbackend.service;

import com.example.billscalculatorbackend.model.Hotovost;
import com.example.billscalculatorbackend.model.User;
import com.example.billscalculatorbackend.repository.HotovostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HotovostService {

    private final HotovostRepository hotovostRepo;

    public Hotovost get(User user) {
        return hotovostRepo.findByUser(user).orElseGet(() -> {
            Hotovost h = new Hotovost();
            h.setUser(user);
            return hotovostRepo.save(h);
        });
    }

    @Transactional
    public Hotovost update(User user, Hotovost incoming) {
        Hotovost h = get(user);
        h.setKusy5000(incoming.getKusy5000());
        h.setKusy2000(incoming.getKusy2000());
        h.setKusy1000(incoming.getKusy1000());
        h.setKusy500(incoming.getKusy500());
        h.setKusy200(incoming.getKusy200());
        h.setKusy100(incoming.getKusy100());
        h.setKusy50(incoming.getKusy50());
        h.setKusy20(incoming.getKusy20());
        h.setKusy10(incoming.getKusy10());
        h.setKusy5(incoming.getKusy5());
        h.setKusy2(incoming.getKusy2());
        h.setKusy1(incoming.getKusy1());
        return hotovostRepo.save(h);
    }
}

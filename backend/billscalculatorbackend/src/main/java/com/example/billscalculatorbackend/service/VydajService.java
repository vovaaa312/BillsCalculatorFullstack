package com.example.billscalculatorbackend.service;

import com.example.billscalculatorbackend.model.User;
import com.example.billscalculatorbackend.model.Vydaj;
import com.example.billscalculatorbackend.repository.VydajRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VydajService {

    private final VydajRepository vydajRepo;

    public List<Vydaj> getAll(User user) {
        return vydajRepo.findByUser(user);
    }

    @Transactional
    public Vydaj create(User user, Vydaj vydaj) {
        vydaj.setId(null);
        vydaj.setUser(user);
        return vydajRepo.save(vydaj);
    }

    @Transactional
    public Vydaj update(User user, Long id, Vydaj updated) {
        Vydaj existing = vydajRepo.findById(id)
                .filter(v -> v.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        existing.setNazev(updated.getNazev());
        existing.setCastka(updated.getCastka());
        return vydajRepo.save(existing);
    }

    @Transactional
    public void delete(User user, Long id) {
        vydajRepo.findById(id)
                .filter(v -> v.getUser().getId().equals(user.getId()))
                .ifPresent(vydajRepo::delete);
    }
}

package com.example.billscalculatorbackend.service;

import com.example.billscalculatorbackend.dto.FakturaFilterDto;
import com.example.billscalculatorbackend.model.Faktura;
import com.example.billscalculatorbackend.model.User;
import com.example.billscalculatorbackend.repository.FakturaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FakturaService {

    private final FakturaRepository fakturaRepo;

    public List<Faktura> getAll(User user) {
        return fakturaRepo.findByUserWithPolozky(user);
    }

    public List<Faktura> getFiltered(User user, FakturaFilterDto filter) {
        return fakturaRepo.findFiltered(user,
                filter.getNazev(), filter.getTypPlatby(), filter.getStatus(),
                filter.getDateFrom(), filter.getDateTo(),
                filter.getAmountMin(), filter.getAmountMax());
    }

    @Transactional
    public Faktura create(User user, Faktura faktura) {
        faktura.setId(null);
        faktura.setUser(user);
        faktura.getPolozky().forEach(p -> p.setFaktura(faktura));
        if (faktura.getPolozky().isEmpty()) {
            // castka already set from frontend
        } else {
            faktura.recomputeCastkaFromPolozky();
        }
        return fakturaRepo.save(faktura);
    }

    @Transactional
    public Faktura update(User user, Long id, Faktura updated) {
        Faktura existing = fakturaRepo.findById(id)
                .filter(f -> f.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        existing.setNazev(updated.getNazev());
        existing.setTypPlatby(updated.getTypPlatby());
        existing.setStatus(updated.getStatus());
        existing.setDatum(updated.getDatum());
        existing.getPolozky().clear();
        updated.getPolozky().forEach(p -> { p.setId(null); p.setFaktura(existing); existing.getPolozky().add(p); });
        if (existing.getPolozky().isEmpty()) existing.setCastka(updated.getCastka());
        else existing.recomputeCastkaFromPolozky();
        return fakturaRepo.save(existing);
    }

    @Transactional
    public void delete(User user, Long id) {
        fakturaRepo.findById(id)
                .filter(f -> f.getUser().getId().equals(user.getId()))
                .ifPresent(fakturaRepo::delete);
    }
}

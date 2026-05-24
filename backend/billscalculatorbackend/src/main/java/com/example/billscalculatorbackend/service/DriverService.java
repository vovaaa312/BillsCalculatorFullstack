package com.example.billscalculatorbackend.service;

import com.example.billscalculatorbackend.dto.DriverFilterDto;
import com.example.billscalculatorbackend.model.DriverShift;
import com.example.billscalculatorbackend.model.User;
import com.example.billscalculatorbackend.repository.DriverShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DriverService {

    private final DriverShiftRepository driverRepo;

    public List<DriverShift> getAll(User user) {
        return driverRepo.findByUserOrderByStartDesc(user);
    }

    public List<DriverShift> getFiltered(User user, DriverFilterDto filter) {
        return driverRepo.findByUserOrderByStartDesc(user).stream()
            .filter(d -> filter.getDriverName() == null ||
                         d.getDriverName().toLowerCase().contains(filter.getDriverName().toLowerCase()))
            .filter(d -> filter.getDateFrom() == null ||
                         !d.getStart().toLocalDate().isBefore(filter.getDateFrom()))
            .filter(d -> filter.getDateTo() == null ||
                         !d.getStart().toLocalDate().isAfter(filter.getDateTo()))
            .collect(Collectors.toList());
    }

    @Transactional
    public DriverShift create(User user, DriverShift shift) {
        shift.setId(null);
        shift.setUser(user);
        return driverRepo.save(shift);
    }

    @Transactional
    public DriverShift update(User user, Long id, DriverShift updated) {
        DriverShift existing = driverRepo.findById(id)
                .filter(d -> d.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        existing.setDriverName(updated.getDriverName());
        existing.setStart(updated.getStart());
        existing.setEnd(updated.getEnd());
        existing.setKmStart(updated.getKmStart());
        existing.setKmEnd(updated.getKmEnd());
        existing.setHourlyRate(updated.getHourlyRate());
        return driverRepo.save(existing);
    }

    @Transactional
    public void delete(User user, Long id) {
        driverRepo.findById(id)
                .filter(d -> d.getUser().getId().equals(user.getId()))
                .ifPresent(driverRepo::delete);
    }
}

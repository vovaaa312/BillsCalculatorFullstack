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

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DriverService {

    private final DriverShiftRepository driverRepo;

    public List<DriverShift> getAll(User user) {
        return driverRepo.findByUserOrderByStartDesc(user);
    }

    public List<DriverShift> getFiltered(User user, DriverFilterDto filter) {
        LocalDateTime from = filter.getDateFrom() != null ? filter.getDateFrom().atStartOfDay() : null;
        LocalDateTime to   = filter.getDateTo()   != null ? filter.getDateTo().atTime(LocalTime.MAX) : null;
        return driverRepo.findFiltered(user, filter.getDriverName(), from, to);
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

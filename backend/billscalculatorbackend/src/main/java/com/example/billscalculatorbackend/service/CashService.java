package com.example.billscalculatorbackend.service;

import com.example.billscalculatorbackend.model.Cash;
import com.example.billscalculatorbackend.model.User;
import com.example.billscalculatorbackend.repository.CashRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CashService {

    private final CashRepository cashRepo;

    public Cash get(User user) {
        return cashRepo.findByUser(user).orElseGet(() -> {
            Cash c = new Cash();
            c.setUser(user);
            return cashRepo.save(c);
        });
    }

    @Transactional
    public Cash update(User user, Cash incoming) {
        Cash c = get(user);
        c.setCount5000(incoming.getCount5000());
        c.setCount2000(incoming.getCount2000());
        c.setCount1000(incoming.getCount1000());
        c.setCount500(incoming.getCount500());
        c.setCount200(incoming.getCount200());
        c.setCount100(incoming.getCount100());
        c.setCount50(incoming.getCount50());
        c.setCount20(incoming.getCount20());
        c.setCount10(incoming.getCount10());
        c.setCount5(incoming.getCount5());
        c.setCount2(incoming.getCount2());
        c.setCount1(incoming.getCount1());
        return cashRepo.save(c);
    }
}

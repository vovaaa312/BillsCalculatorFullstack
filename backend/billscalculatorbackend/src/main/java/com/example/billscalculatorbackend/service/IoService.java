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

    private final InvoiceRepository   invoiceRepo;
    private final ExpenseRepository   expenseRepo;
    private final DriverShiftRepository driverRepo;
    private final CashRepository      cashRepo;

    public AppData buildAppData(User user) {
        AppData data = new AppData();
        data.getInvoices().addAll(invoiceRepo.findByUserWithItems(user));
        data.getExpenses().addAll(expenseRepo.findByUser(user));
        data.getDriverShifts().addAll(driverRepo.findByUserOrderByStartDesc(user));
        cashRepo.findByUser(user).ifPresent(data::setCash);
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
        data.getInvoices().forEach(f -> {
            f.setId(null);
            f.setUser(user);
            f.getItems().forEach(p -> { p.setId(null); p.setInvoice(f); });
            invoiceRepo.save(f);
        });
        data.getExpenses().forEach(v -> { v.setId(null); v.setUser(user); expenseRepo.save(v); });
        data.getDriverShifts().forEach(d -> { d.setId(null); d.setUser(user); driverRepo.save(d); });
        if (data.getCash() != null) {
            Cash c = cashRepo.findByUser(user).orElse(new Cash());
            c.setUser(user);
            c.setCount5000(data.getCash().getCount5000());
            c.setCount2000(data.getCash().getCount2000());
            c.setCount1000(data.getCash().getCount1000());
            c.setCount500(data.getCash().getCount500());
            c.setCount200(data.getCash().getCount200());
            c.setCount100(data.getCash().getCount100());
            c.setCount50(data.getCash().getCount50());
            c.setCount20(data.getCash().getCount20());
            c.setCount10(data.getCash().getCount10());
            c.setCount5(data.getCash().getCount5());
            c.setCount2(data.getCash().getCount2());
            c.setCount1(data.getCash().getCount1());
            cashRepo.save(c);
        }
    }

    @Transactional
    public void clearAll(User user) {
        invoiceRepo.deleteByUser(user);
        expenseRepo.deleteByUser(user);
        driverRepo.deleteByUser(user);
        cashRepo.deleteByUser(user);
    }
}

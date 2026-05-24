package com.example.billscalculatorbackend.service;

import com.example.billscalculatorbackend.model.AppData;
import com.example.billscalculatorbackend.model.User;
import com.example.billscalculatorbackend.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final IoService ioService;

    public String buildText(User user, String lang) {
        AppData data = ioService.buildAppData(user);
        ReportStrings strings = switch (lang.toLowerCase()) {
            case "en" -> new EnglishReportStrings();
            case "ru" -> new RussianReportStrings();
            case "ua" -> new UkrainianReportStrings();
            default  -> new CzechReportStrings();
        };
        return ReportBuilder.build(data, strings);
    }

    public byte[] buildPdf(User user, String lang) throws Exception {
        return PdfExporter.export(buildText(user, lang));
    }
}

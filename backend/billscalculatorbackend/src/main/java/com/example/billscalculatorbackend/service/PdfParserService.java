package com.example.billscalculatorbackend.service;

import com.example.billscalculatorbackend.model.Faktura;
import com.example.billscalculatorbackend.util.PdfParser;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
public class PdfParserService {

    public List<Faktura> parseUpload(MultipartFile file) throws Exception {
        String text = extractText(file);
        if (text.isBlank()) return List.of();
        Faktura faktura = PdfParser.parse(text);
        return faktura != null ? List.of(faktura) : List.of();
    }

    private String extractText(MultipartFile file) throws Exception {
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (name.endsWith(".pdf")) {
            try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
                String text = new PDFTextStripper().getText(doc);
                if (!text.isBlank()) return text;
            }
        }
        return "";
    }
}

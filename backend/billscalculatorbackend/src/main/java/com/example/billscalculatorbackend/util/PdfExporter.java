package com.example.billscalculatorbackend.util;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.text.Normalizer;

public class PdfExporter {

    public static byte[] export(String text) throws IOException {
        try (PDDocument doc = new PDDocument()) {
            PDType1Font font = new PDType1Font(Standard14Fonts.FontName.COURIER);
            float fontSize = 8f;
            float margin   = 30f;
            float pageHeight = PDRectangle.A4.getHeight();
            float leading    = fontSize * 1.2f;
            float yStart     = pageHeight - margin;

            String[] lines = text.split("\n", -1);
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);
            PDPageContentStream cs = new PDPageContentStream(doc, page);
            cs.setFont(font, fontSize);
            cs.beginText();
            cs.newLineAtOffset(margin, yStart);
            float y = yStart;

            for (String line : lines) {
                if (y < margin + leading) {
                    cs.endText();
                    cs.close();
                    page = new PDPage(PDRectangle.A4);
                    doc.addPage(page);
                    cs = new PDPageContentStream(doc, page);
                    cs.setFont(font, fontSize);
                    cs.beginText();
                    y = yStart;
                    cs.newLineAtOffset(margin, y);
                }
                cs.showText(stripDiacritics(line));
                cs.newLineAtOffset(0, -leading);
                y -= leading;
            }
            cs.endText();
            cs.close();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    private static String stripDiacritics(String s) {
        return Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
    }
}

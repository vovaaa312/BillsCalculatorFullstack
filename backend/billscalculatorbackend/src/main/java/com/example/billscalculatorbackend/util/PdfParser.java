package com.example.billscalculatorbackend.util;

import com.example.billscalculatorbackend.model.Invoice;
import com.example.billscalculatorbackend.model.InvoiceItem;
import com.example.billscalculatorbackend.model.InvoiceStatus;
import com.example.billscalculatorbackend.model.PaymentType;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PdfParser {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    public static Invoice parse(String text) {
        return buildInvoice(text);
    }

    private static Invoice buildInvoice(String text) {
        Invoice f = new Invoice();
        f.setName(extractName(text));
        f.setPaymentType(extractPaymentType(text));
        f.setStatus(InvoiceStatus.NESPLNENA);
        f.setDate(extractDate(text));
        List<InvoiceItem> items = extractItems(text);
        f.getItems().addAll(items);
        int total = extractAmount(text);
        if (total > 0) f.setAmount(total);
        else f.recomputeAmountFromItems();
        return f;
    }

    private static String extractName(String text) {
        Matcher m = Pattern.compile("objedn[aá]vky\\s*:\\s*([^\\r\\n]+)", Pattern.CASE_INSENSITIVE).matcher(text);
        if (m.find()) { String name = m.group(1).trim(); if (!name.isEmpty()) return name; }
        return "Neznamy odberatel";
    }

    private static int extractAmount(String text) {
        Matcher m = Pattern.compile("CELKEM\\s+K\\s+[ÚU]HRAD[EĚ][^\\d]*?([\\d\\s\\u00a0]+[,.]\\d{2})",
                Pattern.CASE_INSENSITIVE | Pattern.DOTALL).matcher(text);
        if (m.find()) return parseAmount(m.group(1));
        Matcher m2 = Pattern.compile("Sou[čc]et\\s+polo[žz]ek[^\\d]*?(\\d[\\d\\s\\u00a0]*[,.]\\d{2})",
                Pattern.CASE_INSENSITIVE | Pattern.DOTALL).matcher(text);
        if (m2.find()) return parseAmount(m2.group(1));
        return 0;
    }

    private static PaymentType extractPaymentType(String text) {
        Matcher m = Pattern.compile("Forma\\s+[úu]hrady[\\s:]*([^\\r\\n]+)", Pattern.CASE_INSENSITIVE).matcher(text);
        if (m.find()) {
            String forma = m.group(1).trim().toLowerCase();
            if (forma.contains("hotov")) return PaymentType.HOTOVOST;
            if (forma.contains("převod") || forma.contains("prevod") || forma.contains("bank")) return PaymentType.PREVOD;
        }
        if (text.toLowerCase().contains("uhrazeno hotov")) return PaymentType.HOTOVOST;
        return PaymentType.PREVOD;
    }

    private static LocalDate extractDate(String text) {
        Matcher m = Pattern.compile("Datum\\s+vystaven[ií][\\s:]*(\\d{2}\\.\\d{2}\\.\\d{4})").matcher(text);
        if (m.find()) { try { return LocalDate.parse(m.group(1), DATE_FMT); } catch (Exception ignored) {} }
        Matcher m2 = Pattern.compile("(\\d{2}\\.\\d{2}\\.\\d{4})").matcher(text);
        if (m2.find()) { try { return LocalDate.parse(m2.group(1), DATE_FMT); } catch (Exception ignored) {} }
        return LocalDate.now();
    }

    private static List<InvoiceItem> extractItems(String text) {
        List<InvoiceItem> inline = extractItemsInline(text);
        if (!inline.isEmpty()) return inline;
        return extractItemsColumnar(text);
    }

    private static List<InvoiceItem> extractItemsInline(String text) {
        List<InvoiceItem> out = new ArrayList<>();
        String[] lines = text.split("\\r?\\n");
        boolean inSection = false;
        String num = "(\\d{1,3}(?:[\\s\\u00a0]\\d{3})*[,.]\\d{2})";

        // Format A (5 price values): name qty ks p1 p2 [opt%] p3 VAT% p4 p5
        Pattern patA = Pattern.compile(
            "^(.+?)\\s+(\\d+)\\s+ks\\s+" + num + "\\s+" + num +
            "(?:\\s+\\d+(?:[,.]\\d+)?\\s*%)?\\s+" + num +
            "\\s+(\\d+)\\s*%\\s+" + num + "\\s+" + num + "\\s*$");

        // Format B (POHODA/BAGSY): name qty ks J.cena(excl) Cena(excl) VAT% DPH total
        Pattern patB = Pattern.compile(
            "^(.+?)\\s+(\\d+)\\s+ks\\s+" + num + "\\s+" + num +
            "\\s+(\\d{1,2})\\s*%\\s+" + num + "\\s+" + num + "\\s*$");

        for (String raw : lines) {
            String line = raw.trim();
            if (line.isEmpty()) continue;
            if (!inSection) { if (containsCi(line,"Označení dodávky")||containsCi(line,"Oznaceni dodavky")) inSection=true; continue; }
            if (containsCi(line,"Součet položek")||containsCi(line,"Soucet polozek")||containsCi(line,"CELKEM K")||containsCi(line,"Rekapitulace DPH")) break;

            Matcher m = patA.matcher(line);
            if (m.matches()) {
                String name = cleanName(m.group(1));
                try {
                    out.add(new InvoiceItem(name, Integer.parseInt(m.group(2)),
                        parseDouble(m.group(3)), parseDouble(m.group(4)), parseDouble(m.group(5)),
                        Integer.parseInt(m.group(6)), parseDouble(m.group(7)), parseDouble(m.group(8))));
                } catch (NumberFormatException ignored) {}
                continue;
            }

            Matcher mb = patB.matcher(line);
            if (mb.matches()) {
                String name = cleanName(mb.group(1));
                try {
                    int qty     = Integer.parseInt(mb.group(2));
                    double jcena  = parseDouble(mb.group(3));  // unit price excl. VAT
                    double cena   = parseDouble(mb.group(4));  // total excl. VAT
                    int vatPct  = Integer.parseInt(mb.group(5));
                    double dph    = parseDouble(mb.group(6));  // VAT amount
                    double total  = parseDouble(mb.group(7));  // total incl. VAT
                    double unitWithVat = Math.round(jcena * (1 + vatPct / 100.0) * 100.0) / 100.0;
                    out.add(new InvoiceItem(name, qty, unitWithVat, jcena, cena, vatPct, dph, total));
                } catch (NumberFormatException ignored) {}
            }
        }
        return out;
    }

    private static String cleanName(String raw) {
        String name = raw.trim();
        int colon = name.lastIndexOf(':');
        if (colon >= 0 && colon < name.length() - 1) name = name.substring(colon + 1).trim();
        return name;
    }

    private static List<InvoiceItem> extractItemsColumnar(String text) {
        List<InvoiceItem> out = new ArrayList<>();
        String[] lines = text.split("\\r?\\n");
        boolean inNamesSection = false;
        List<String> names = new ArrayList<>();
        for (String raw : lines) {
            String line = raw.trim();
            if (line.isEmpty()) continue;
            if (!inNamesSection) { if (containsCi(line,"Označení dodávky")||containsCi(line,"Oznaceni dodavky")) inNamesSection=true; continue; }
            if (containsCi(line,"Součet položek")||containsCi(line,"Soucet polozek")||containsCi(line,"CELKEM K")||containsCi(line,"Rekapitulace DPH")) break;
            if (line.length()<3||line.matches("\\d.*")||line.matches("[A-Z]{2,}\\d.*")) continue;
            if (containsCi(line,"IČ:")||containsCi(line,"DIČ:")||line.contains("http")||line.contains("www")||line.contains("/")) continue;
            if (line.matches(".*\\d{3}\\s+\\d{2}.*")||!line.matches(".*[a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ].*")) continue;
            String ll = line.toLowerCase();
            if (ll.contains("s.r.o")||ll.contains(" a.s")||ll.contains("republika")||ll.contains("czech")) continue;
            names.add(line);
        }
        if (names.isEmpty()) return out;
        Pattern qtyPat=Pattern.compile("^(\\d+)\\s*ks$",Pattern.CASE_INSENSITIVE);
        Pattern pricePat=Pattern.compile("^([|\\d][|\\d\\s\\u00a0]*[,.]\\d{2})\\s*$");
        Pattern dphPct=Pattern.compile("^(\\d{1,2})\\s*%$");
        List<Integer> qtys=new ArrayList<>(); List<Double> jcenas=new ArrayList<>(),jcenaBezDphs=new ArrayList<>(),totals=new ArrayList<>(); List<Integer> dphs=new ArrayList<>();
        ColState state=ColState.NAMES;
        boolean seenJ=false,seenJBez=false,seenCP=false,seenDA=false,seenT=false,stopT=false;
        for (String raw:lines) {
            String line=raw.trim(); if (line.isEmpty()) continue;
            if (containsCi(line,"Celkem s DPH")) break;
            if (containsCi(line,"Základ v Kč")||containsCi(line,"Sazba")||containsCi(line,"DPH v Kč")||containsCi(line,"Rekapitulace DPH")) continue;
            if (!seenT&&containsCi(line,"Kč Celkem")) { state=ColState.TOTALS; seenT=true; continue; }
            if (!seenCP&&containsCi(line,"Cena")&&containsCi(line,"%DPH")) { state=ColState.CENA_PCT; seenCP=true; continue; }
            if (!seenJBez&&(containsCi(line,"bez DPH")||containsCi(line,"J.cena bez"))) { state=ColState.JCENA_BEZ_DPH; seenJBez=true; continue; }
            if (!seenJ&&line.replaceAll("\\s","").equalsIgnoreCase("J.cena")) { state=ColState.JCENA; seenJ=true; continue; }
            if (!seenDA&&line.equalsIgnoreCase("DPH")) { state=ColState.DPH_AMT; seenDA=true; continue; }
            if (containsCi(line,"Množství")) { state=ColState.NAMES; continue; }
            if (state==ColState.TOTALS&&(containsCi(line,"Součet")||containsCi(line,"CELKEM"))) { stopT=true; continue; }
            Matcher qm=qtyPat.matcher(line),pm=pricePat.matcher(line),dm=dphPct.matcher(line);
            if (qm.matches()) { qtys.add(Integer.parseInt(qm.group(1))); continue; }
            if (pm.matches()) {
                double val=parseDouble(pm.group(1));
                switch(state) {
                    case JCENA: if(jcenas.size()<names.size()) jcenas.add(val); break;
                    case JCENA_BEZ_DPH: if(jcenaBezDphs.size()<names.size()) jcenaBezDphs.add(val); break;
                    case CENA_PCT: if(jcenas.size()<names.size()) jcenas.add(val); break;
                    case TOTALS: if(!stopT&&totals.size()<names.size()) totals.add(val); break;
                    default: break;
                }
                continue;
            }
            if (dm.matches()&&state==ColState.CENA_PCT&&dphs.size()<names.size()) dphs.add(Integer.parseInt(dm.group(1)));
        }
        for (int i=0;i<names.size();i++) {
            int qty=i<qtys.size()?qtys.get(i):1;
            double jcena=i<jcenas.size()?jcenas.get(i):0;
            double jcenaBezDph=i<jcenaBezDphs.size()?jcenaBezDphs.get(i):0;
            int dphPct2=i<dphs.size()?dphs.get(i):12;
            double total2=i<totals.size()?totals.get(i):jcena*qty;
            out.add(new InvoiceItem(names.get(i),qty,jcena,jcenaBezDph,jcena,dphPct2,jcena-jcenaBezDph,total2));
        }
        return out;
    }

    private enum ColState { NAMES, JCENA, JCENA_BEZ_DPH, CENA_PCT, DPH_AMT, TOTALS }

    private static boolean containsCi(String h, String n) { return h.toLowerCase().contains(n.toLowerCase()); }
    private static int parseAmount(String s) { return (int) Math.round(parseDouble(s)); }
    private static double parseDouble(String s) {
        if (s==null) return 0;
        String clean=s.trim().replaceAll("^\\|","1").replaceAll("[\\s\\u00a0]","").replace(',','.');
        try { return Double.parseDouble(clean); } catch (NumberFormatException e) { return 0; }
    }
}

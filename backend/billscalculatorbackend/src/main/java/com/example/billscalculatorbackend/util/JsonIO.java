package com.example.billscalculatorbackend.util;

import com.example.billscalculatorbackend.model.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Minimal hand-written JSON serializer — no external libs.
 * Used for import/export to stay compatible with the Android app format.
 */
public class JsonIO {

    public static String serialize(AppData data) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\n");

        sb.append("  \"faktury\": [\n");
        List<Faktura> fList = new ArrayList<>(data.getFaktury());
        for (int i = 0; i < fList.size(); i++) {
            Faktura f = fList.get(i);
            sb.append("    {\n");
            sb.append("      \"nazev\": ").append(jsonStr(f.getNazev())).append(",\n");
            sb.append("      \"castka\": ").append(f.getCastka()).append(",\n");
            sb.append("      \"typ\": ").append(jsonStr(f.getTypPlatby().name())).append(",\n");
            sb.append("      \"status\": ").append(jsonStr(f.getStatus().name())).append(",\n");
            sb.append("      \"datum\": ").append(jsonStr(f.getDatum() != null ? f.getDatum().toString() : "")).append(",\n");
            sb.append("      \"polozky\": [");
            List<Polozka> pList = f.getPolozky();
            for (int j = 0; j < pList.size(); j++) {
                Polozka p = pList.get(j);
                sb.append(j == 0 ? "\n" : ",\n");
                sb.append("        {");
                sb.append("\"nazev\":").append(jsonStr(p.getNazev())).append(",");
                sb.append("\"mnozstvi\":").append(p.getMnozstvi()).append(",");
                sb.append("\"jcena\":").append(p.getJcena()).append(",");
                sb.append("\"jcenaBezDph\":").append(p.getJcenaBezDph()).append(",");
                sb.append("\"cena\":").append(p.getCena()).append(",");
                sb.append("\"dphProcent\":").append(p.getDphProcent()).append(",");
                sb.append("\"dphCastka\":").append(p.getDphCastka()).append(",");
                sb.append("\"kcCelkem\":").append(p.getKcCelkem());
                sb.append("}");
            }
            if (!pList.isEmpty()) sb.append("\n      ");
            sb.append("]\n    }");
            if (i < fList.size() - 1) sb.append(",");
            sb.append("\n");
        }
        sb.append("  ],\n");

        sb.append("  \"vydaje\": [\n");
        List<Vydaj> vList = new ArrayList<>(data.getVydaje());
        for (int i = 0; i < vList.size(); i++) {
            Vydaj v = vList.get(i);
            sb.append("    {\n");
            sb.append("      \"nazev\": ").append(jsonStr(v.getNazev())).append(",\n");
            sb.append("      \"castka\": ").append(v.getCastka()).append("\n");
            sb.append("    }");
            if (i < vList.size() - 1) sb.append(",");
            sb.append("\n");
        }
        sb.append("  ],\n");

        sb.append("  \"driverShifts\": [\n");
        List<DriverShift> dList = new ArrayList<>(data.getDriverShifts());
        for (int i = 0; i < dList.size(); i++) {
            DriverShift d = dList.get(i);
            sb.append("    {\n");
            sb.append("      \"driverName\": ").append(jsonStr(d.getDriverName())).append(",\n");
            sb.append("      \"start\": ").append(jsonStr(d.getStart() != null ? d.getStart().toString() : "")).append(",\n");
            sb.append("      \"end\": ").append(jsonStr(d.getEnd() != null ? d.getEnd().toString() : "")).append(",\n");
            sb.append("      \"kmStart\": ").append(d.getKmStart()).append(",\n");
            sb.append("      \"kmEnd\": ").append(d.getKmEnd()).append(",\n");
            sb.append("      \"hourlyRate\": ").append(d.getHourlyRate()).append("\n");
            sb.append("    }");
            if (i < dList.size() - 1) sb.append(",");
            sb.append("\n");
        }
        sb.append("  ],\n");

        Hotovost h = data.getHotovost();
        sb.append("  \"hotovost\": {\n");
        sb.append("    \"k5000\": ").append(h.getKusy5000()).append(",\n");
        sb.append("    \"k2000\": ").append(h.getKusy2000()).append(",\n");
        sb.append("    \"k1000\": ").append(h.getKusy1000()).append(",\n");
        sb.append("    \"k500\": ").append(h.getKusy500()).append(",\n");
        sb.append("    \"k200\": ").append(h.getKusy200()).append(",\n");
        sb.append("    \"k100\": ").append(h.getKusy100()).append(",\n");
        sb.append("    \"mince\": ").append(h.getMince()).append("\n");
        sb.append("  }\n}\n");
        return sb.toString();
    }

    public static void deserialize(AppData data, String json) {
        data.getFaktury().clear();
        data.getVydaje().clear();
        data.getDriverShifts().clear();

        for (String obj : splitObjects(extractArray(json, "faktury"))) {
            String nazev = strField(obj, "nazev");
            int castka   = intField(obj, "castka");
            TypPlatby typ;
            try { typ = TypPlatby.valueOf(strField(obj, "typ")); } catch (Exception e) { typ = TypPlatby.PREVOD; }
            StatusFaktury stat;
            try { stat = StatusFaktury.valueOf(strField(obj, "status")); } catch (Exception e) { stat = StatusFaktury.NESPLNENA; }
            String datumStr = strField(obj, "datum");
            LocalDate datum = datumStr.isEmpty() ? LocalDate.now() : LocalDate.parse(datumStr);
            Faktura faktura = new Faktura(nazev, castka, typ, stat, datum);
            for (String pObj : splitObjects(extractArray(obj, "polozky"))) {
                Polozka p = new Polozka();
                p.setNazev(strField(pObj, "nazev"));
                p.setMnozstvi(intField(pObj, "mnozstvi"));
                p.setJcena(doubleField(pObj, "jcena"));
                p.setJcenaBezDph(doubleField(pObj, "jcenaBezDph"));
                p.setCena(doubleField(pObj, "cena"));
                p.setDphProcent(intField(pObj, "dphProcent"));
                p.setDphCastka(doubleField(pObj, "dphCastka"));
                p.setKcCelkem(doubleField(pObj, "kcCelkem"));
                p.setFaktura(faktura);
                faktura.getPolozky().add(p);
            }
            data.getFaktury().add(faktura);
        }

        for (String obj : splitObjects(extractArray(json, "vydaje")))
            data.getVydaje().add(new Vydaj(strField(obj, "nazev"), intField(obj, "castka")));

        for (String obj : splitObjects(extractArray(json, "driverShifts"))) {
            String name = strField(obj, "driverName");
            String startS = strField(obj, "start"), endS = strField(obj, "end");
            if (name.isEmpty() || startS.isEmpty() || endS.isEmpty()) continue;
            DriverShift ds = new DriverShift(name, LocalDateTime.parse(startS), LocalDateTime.parse(endS));
            ds.setKmStart(intField(obj, "kmStart"));
            ds.setKmEnd(intField(obj, "kmEnd"));
            ds.setHourlyRate(doubleField(obj, "hourlyRate"));
            data.getDriverShifts().add(ds);
        }

        String hBlock = extractObject(json, "hotovost");
        Hotovost h = data.getHotovost() != null ? data.getHotovost() : new Hotovost();
        h.setKusy5000(intField(hBlock, "k5000"));
        h.setKusy2000(intField(hBlock, "k2000"));
        h.setKusy1000(intField(hBlock, "k1000"));
        h.setKusy500(intField(hBlock, "k500"));
        h.setKusy200(intField(hBlock, "k200"));
        h.setKusy100(intField(hBlock, "k100"));
        h.setMince(intField(hBlock, "mince"));
        data.setHotovost(h);
    }

    private static String jsonStr(String s) {
        if (s == null) s = "";
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    private static String extractArray(String json, String key) {
        int start = json.indexOf("\"" + key + "\""); if (start < 0) return "";
        int bracket = json.indexOf('[', start); if (bracket < 0) return "";
        int depth = 0;
        for (int i = bracket; i < json.length(); i++) {
            char c = json.charAt(i);
            if (c == '[') depth++; else if (c == ']') { depth--; if (depth == 0) return json.substring(bracket + 1, i); }
        }
        return "";
    }

    private static String extractObject(String json, String key) {
        int start = json.indexOf("\"" + key + "\""); if (start < 0) return "";
        int brace = json.indexOf('{', start); if (brace < 0) return "";
        int depth = 0;
        for (int i = brace; i < json.length(); i++) {
            char c = json.charAt(i);
            if (c == '{') depth++; else if (c == '}') { depth--; if (depth == 0) return json.substring(brace + 1, i); }
        }
        return "";
    }

    private static List<String> splitObjects(String body) {
        List<String> result = new ArrayList<>();
        int depth = 0, start = -1;
        for (int i = 0; i < body.length(); i++) {
            char c = body.charAt(i);
            if (c == '{') { if (depth == 0) start = i; depth++; }
            else if (c == '}') { depth--; if (depth == 0 && start >= 0) { result.add(body.substring(start + 1, i)); start = -1; } }
        }
        return result;
    }

    private static String strField(String obj, String key) {
        int ki = obj.indexOf("\"" + key + "\""); if (ki < 0) return "";
        int colon = obj.indexOf(':', ki), q1 = obj.indexOf('"', colon + 1); if (q1 < 0) return "";
        int q2 = q1 + 1;
        while (q2 < obj.length()) { if (obj.charAt(q2) == '"' && obj.charAt(q2 - 1) != '\\') break; q2++; }
        return obj.substring(q1 + 1, q2).replace("\\\"", "\"").replace("\\\\", "\\");
    }

    private static double doubleField(String obj, String key) {
        int ki = obj.indexOf("\"" + key + "\""); if (ki < 0) return 0;
        int colon = obj.indexOf(':', ki), ns = colon + 1;
        while (ns < obj.length() && (obj.charAt(ns) == ' ' || obj.charAt(ns) == '\t')) ns++;
        int ne = ns;
        while (ne < obj.length()) { char c = obj.charAt(ne); if (Character.isDigit(c) || c == '-' || c == '.' || c == 'e' || c == 'E' || c == '+') ne++; else break; }
        try { return Double.parseDouble(obj.substring(ns, ne).trim()); } catch (NumberFormatException e) { return 0; }
    }

    private static int intField(String obj, String key) {
        int ki = obj.indexOf("\"" + key + "\""); if (ki < 0) return 0;
        int colon = obj.indexOf(':', ki), ns = colon + 1;
        while (ns < obj.length() && !Character.isDigit(obj.charAt(ns)) && obj.charAt(ns) != '-') ns++;
        int ne = ns;
        while (ne < obj.length() && (Character.isDigit(obj.charAt(ne)) || obj.charAt(ne) == '-')) ne++;
        try { return Integer.parseInt(obj.substring(ns, ne).trim()); } catch (NumberFormatException e) { return 0; }
    }
}

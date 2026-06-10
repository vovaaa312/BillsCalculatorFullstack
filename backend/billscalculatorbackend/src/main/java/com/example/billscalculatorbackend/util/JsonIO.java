package com.example.billscalculatorbackend.util;

import com.example.billscalculatorbackend.model.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Hand-written JSON serializer for import/export.
 * Key names kept compatible with Android app format.
 */
public class JsonIO {

    public static String serialize(AppData data) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\n");

        sb.append("  \"faktury\": [\n");
        List<Invoice> fList = new ArrayList<>(data.getInvoices());
        for (int i = 0; i < fList.size(); i++) {
            Invoice f = fList.get(i);
            sb.append("    {\n");
            sb.append("      \"id\": ").append(f.getId() != null ? f.getId() : 0).append(",\n");
            sb.append("      \"hasPdf\": ").append(Boolean.TRUE.equals(f.getHasPdf())).append(",\n");
            sb.append("      \"nazev\": ").append(jsonStr(f.getName())).append(",\n");
            sb.append("      \"castka\": ").append(f.getAmount()).append(",\n");
            sb.append("      \"typ\": ").append(jsonStr(f.getPaymentType().name())).append(",\n");
            sb.append("      \"status\": ").append(jsonStr(f.getStatus().name())).append(",\n");
            sb.append("      \"datum\": ").append(jsonStr(f.getDate() != null ? f.getDate().toString() : "")).append(",\n");
            sb.append("      \"polozky\": [");
            List<InvoiceItem> pList = f.getItems();
            for (int j = 0; j < pList.size(); j++) {
                InvoiceItem p = pList.get(j);
                sb.append(j == 0 ? "\n" : ",\n");
                sb.append("        {");
                sb.append("\"nazev\":").append(jsonStr(p.getName())).append(",");
                sb.append("\"mnozstvi\":").append(p.getQuantity()).append(",");
                sb.append("\"jcena\":").append(p.getUnitPrice()).append(",");
                sb.append("\"jcenaBezDph\":").append(p.getUnitPriceNoVat()).append(",");
                sb.append("\"cena\":").append(p.getPrice()).append(",");
                sb.append("\"dphProcent\":").append(p.getVatPercent()).append(",");
                sb.append("\"dphCastka\":").append(p.getVatAmount()).append(",");
                sb.append("\"kcCelkem\":").append(p.getTotalPrice());
                sb.append("}");
            }
            if (!pList.isEmpty()) sb.append("\n      ");
            sb.append("]\n    }");
            if (i < fList.size() - 1) sb.append(",");
            sb.append("\n");
        }
        sb.append("  ],\n");

        sb.append("  \"vydaje\": [\n");
        List<Expense> vList = new ArrayList<>(data.getExpenses());
        for (int i = 0; i < vList.size(); i++) {
            Expense v = vList.get(i);
            sb.append("    {\n");
            sb.append("      \"nazev\": ").append(jsonStr(v.getName())).append(",\n");
            sb.append("      \"castka\": ").append(v.getAmount()).append("\n");
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

        Cash c = data.getCash();
        sb.append("  \"hotovost\": {\n");
        sb.append("    \"k5000\": ").append(c.getCount5000()).append(",\n");
        sb.append("    \"k2000\": ").append(c.getCount2000()).append(",\n");
        sb.append("    \"k1000\": ").append(c.getCount1000()).append(",\n");
        sb.append("    \"k500\": ").append(c.getCount500()).append(",\n");
        sb.append("    \"k200\": ").append(c.getCount200()).append(",\n");
        sb.append("    \"k100\": ").append(c.getCount100()).append(",\n");
        sb.append("    \"k50\": ").append(c.getCount50()).append(",\n");
        sb.append("    \"k20\": ").append(c.getCount20()).append(",\n");
        sb.append("    \"k10\": ").append(c.getCount10()).append(",\n");
        sb.append("    \"k5\": ").append(c.getCount5()).append(",\n");
        sb.append("    \"k2\": ").append(c.getCount2()).append(",\n");
        sb.append("    \"k1\": ").append(c.getCount1()).append("\n");
        sb.append("  }\n}\n");
        return sb.toString();
    }

    public static void deserialize(AppData data, String json) {
        data.getInvoices().clear();
        data.getExpenses().clear();
        data.getDriverShifts().clear();

        for (String obj : splitObjects(extractArray(json, "faktury"))) {
            String name = strField(obj, "nazev");
            int amount   = intField(obj, "castka");
            PaymentType typ;
            try { typ = PaymentType.valueOf(strField(obj, "typ")); } catch (Exception e) { typ = PaymentType.PREVOD; }
            InvoiceStatus stat;
            try { stat = InvoiceStatus.valueOf(strField(obj, "status")); } catch (Exception e) { stat = InvoiceStatus.NESPLNENA; }
            String dateStr = strField(obj, "datum");
            LocalDate date = dateStr.isEmpty() ? LocalDate.now() : LocalDate.parse(dateStr);
            Invoice invoice = new Invoice(name, amount, typ, stat, date);
            for (String pObj : splitObjects(extractArray(obj, "polozky"))) {
                InvoiceItem p = new InvoiceItem();
                p.setName(strField(pObj, "nazev"));
                p.setQuantity(intField(pObj, "mnozstvi"));
                p.setUnitPrice(doubleField(pObj, "jcena"));
                p.setUnitPriceNoVat(doubleField(pObj, "jcenaBezDph"));
                p.setPrice(doubleField(pObj, "cena"));
                p.setVatPercent(intField(pObj, "dphProcent"));
                p.setVatAmount(doubleField(pObj, "dphCastka"));
                p.setTotalPrice(doubleField(pObj, "kcCelkem"));
                p.setInvoice(invoice);
                invoice.getItems().add(p);
            }
            data.getInvoices().add(invoice);
        }

        for (String obj : splitObjects(extractArray(json, "vydaje")))
            data.getExpenses().add(new Expense(strField(obj, "nazev"), intField(obj, "castka")));

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
        Cash c = data.getCash() != null ? data.getCash() : new Cash();
        c.setCount5000(intField(hBlock, "k5000"));
        c.setCount2000(intField(hBlock, "k2000"));
        c.setCount1000(intField(hBlock, "k1000"));
        c.setCount500(intField(hBlock, "k500"));
        c.setCount200(intField(hBlock, "k200"));
        c.setCount100(intField(hBlock, "k100"));
        c.setCount50(intField(hBlock, "k50"));
        c.setCount20(intField(hBlock, "k20"));
        c.setCount10(intField(hBlock, "k10"));
        c.setCount5(intField(hBlock, "k5"));
        c.setCount2(intField(hBlock, "k2"));
        c.setCount1(intField(hBlock, "k1"));
        data.setCash(c);
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
            char ch = json.charAt(i);
            if (ch == '[') depth++; else if (ch == ']') { depth--; if (depth == 0) return json.substring(bracket + 1, i); }
        }
        return "";
    }

    private static String extractObject(String json, String key) {
        int start = json.indexOf("\"" + key + "\""); if (start < 0) return "";
        int brace = json.indexOf('{', start); if (brace < 0) return "";
        int depth = 0;
        for (int i = brace; i < json.length(); i++) {
            char ch = json.charAt(i);
            if (ch == '{') depth++; else if (ch == '}') { depth--; if (depth == 0) return json.substring(brace + 1, i); }
        }
        return "";
    }

    private static List<String> splitObjects(String body) {
        List<String> result = new ArrayList<>();
        int depth = 0, start = -1;
        for (int i = 0; i < body.length(); i++) {
            char ch = body.charAt(i);
            if (ch == '{') { if (depth == 0) start = i; depth++; }
            else if (ch == '}') { depth--; if (depth == 0 && start >= 0) { result.add(body.substring(start + 1, i)); start = -1; } }
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
        while (ne < obj.length()) { char ch = obj.charAt(ne); if (Character.isDigit(ch) || ch == '-' || ch == '.' || ch == 'e' || ch == 'E' || ch == '+') ne++; else break; }
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

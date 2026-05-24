package com.example.billscalculatorbackend.util;

import com.example.billscalculatorbackend.model.*;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

public class ReportBuilder {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter DT_FMT   = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    public static String build(AppData data, ReportStrings s) {
        StringBuilder sb = new StringBuilder();
        sb.append(s.reportTitle()).append("  -  ")
          .append(LocalDate.now().format(DATE_FMT)).append("\n");

        List<Invoice> all = data.getInvoices();
        sb.append(invoiceTable(s.labelFaktury(), all, data.getInvoiceTotal(), s.footCelkemFaktur(), s)).append('\n');

        List<Invoice> prevod = filter(all, PaymentType.PREVOD, InvoiceStatus.SPLNENA);
        sb.append(invoiceTableWithExtra(s.labelPlatbyPrevodem(), prevod,
                s.footCelkemPrevodem(), data.getTransferTotal(),
                s.footOcekHotov(), data.getCashInvoiceTotal(), s)).append('\n');

        List<Invoice> nespl = filter(all, null, InvoiceStatus.NESPLNENA);
        sb.append(invoiceTable(s.labelNesplneneFaktury(), nespl, data.getUnpaidTotal(), s.footCelkemNesplnene(), s)).append('\n');

        Cash c = data.getCash();
        sb.append(cashTable(s, c)).append('\n');

        List<DriverShift> shifts = data.getDriverShifts();
        if (!shifts.isEmpty()) sb.append(driverTable(s, shifts)).append('\n');

        List<Expense> expenses = data.getExpenses();
        sb.append(expenseTable(s, expenses, data.getExpenseTotal())).append('\n');
        sb.append(totalTable(s, data.getExpectedCash(), c.getTotal(), data.getCashDifference())).append('\n');
        sb.append(countsTable(s, all, prevod, nespl, expenses)).append('\n');

        return sb.toString();
    }

    private static String invoiceTable(String title, List<Invoice> rows,
                                       int total, String footLabel, ReportStrings s) {
        String hdr1 = s.colOdberatel(), hdr2 = s.colCastka(), kc = s.labelKc();
        int c1 = Math.max(title.length(), hdr1.length()), c2 = hdr2.length();
        List<String[]> data = new ArrayList<>();
        for (Invoice f : rows) {
            String n = ascii(f.getName() != null ? f.getName() : "");
            String v = f.getAmount() + " " + kc;
            c1 = Math.max(c1, n.length()); c2 = Math.max(c2, v.length());
            data.add(new String[]{n, v});
        }
        String fVal = total + " " + kc;
        c1 = Math.max(c1, footLabel.length()); c2 = Math.max(c2, fVal.length());
        c1 += 2; c2 += 2;
        int inner = c1 + c2 + 1;
        String hr = "+" + rep('-', c1) + "+" + rep('-', c2) + "+";
        String hrJ = "+" + rep('-', inner) + "+";
        StringBuilder sb = new StringBuilder();
        sb.append(hr).append('\n');
        sb.append(String.format("| %-" + (inner - 1) + "s|\n", title));
        sb.append(hr).append('\n');
        sb.append(String.format("| %-" + (c1 - 1) + "s| %" + (c2 - 1) + "s|\n", hdr1, hdr2));
        sb.append(hr).append('\n');
        for (String[] row : data)
            sb.append(String.format("| %-" + (c1 - 1) + "s| %" + (c2 - 1) + "s|\n", row[0], row[1]));
        sb.append(hrJ).append('\n');
        sb.append(String.format("| %-" + (inner - fVal.length() - 2) + "s%" + fVal.length() + "s|\n", footLabel + ":", fVal));
        sb.append(hrJ).append('\n');
        return sb.toString();
    }

    private static String invoiceTableWithExtra(String title, List<Invoice> rows,
                                                String foot1Label, int foot1Val,
                                                String foot2Label, int foot2Val, ReportStrings s) {
        String hdr1 = s.colOdberatel(), hdr2 = s.colCastka(), kc = s.labelKc();
        int c1 = Math.max(title.length(), Math.max(hdr1.length(), Math.max(foot1Label.length(), foot2Label.length())));
        int c2 = hdr2.length();
        List<String[]> data = new ArrayList<>();
        for (Invoice f : rows) {
            String n = ascii(f.getName() != null ? f.getName() : "");
            String v = f.getAmount() + " " + kc;
            c1 = Math.max(c1, n.length()); c2 = Math.max(c2, v.length());
            data.add(new String[]{n, v});
        }
        String fv1 = foot1Val + " " + kc, fv2 = foot2Val + " " + kc;
        c2 = Math.max(c2, Math.max(fv1.length(), fv2.length()));
        c1 += 2; c2 += 2;
        int inner = c1 + c2 + 1;
        String hr = "+" + rep('-', c1) + "+" + rep('-', c2) + "+";
        String hrJ = "+" + rep('-', inner) + "+";
        StringBuilder sb = new StringBuilder();
        sb.append(hr).append('\n');
        sb.append(String.format("| %-" + (inner - 1) + "s|\n", title));
        sb.append(hr).append('\n');
        sb.append(String.format("| %-" + (c1 - 1) + "s| %" + (c2 - 1) + "s|\n", hdr1, hdr2));
        sb.append(hr).append('\n');
        for (String[] row : data)
            sb.append(String.format("| %-" + (c1 - 1) + "s| %" + (c2 - 1) + "s|\n", row[0], row[1]));
        sb.append(hrJ).append('\n');
        sb.append(String.format("| %-" + (inner - fv1.length() - 2) + "s%" + fv1.length() + "s|\n", foot1Label + ":", fv1));
        sb.append(String.format("| %-" + (inner - fv2.length() - 2) + "s%" + fv2.length() + "s|\n", foot2Label + ":", fv2));
        sb.append(hrJ).append('\n');
        return sb.toString();
    }

    private static String cashTable(ReportStrings s, Cash c) {
        String kc = s.labelKc();
        String[] labels = {"5000 " + kc, "2000 " + kc, "1000 " + kc, " 500 " + kc, " 200 " + kc, " 100 " + kc,
                           "  50 " + kc, "  20 " + kc, "  10 " + kc, "   5 " + kc, "   2 " + kc, "   1 " + kc};
        int[] nominals = c.getNominals(), counts = c.getCounts();
        String[] pcArr = new String[12], amArr = new String[12];
        for (int i = 0; i < 12; i++) { pcArr[i] = String.valueOf(counts[i]); amArr[i] = (nominals[i] * counts[i]) + " " + kc; }
        int c1 = s.colNominal().length(), c2 = s.colPocet().length(), c3 = s.colCastka().length();
        for (String l : labels) c1 = Math.max(c1, l.length());
        for (String p : pcArr) c2 = Math.max(c2, p.length());
        for (String a : amArr) c3 = Math.max(c3, a.length());
        String totalVal = c.getTotal() + " " + kc; c3 = Math.max(c3, totalVal.length());
        c1 += 2; c2 += 2; c3 += 2;
        int inner = c1 + c2 + c3 + 2;
        String hr = "+" + rep('-', c1) + "+" + rep('-', c2) + "+" + rep('-', c3) + "+";
        String hrJ = "+" + rep('-', inner) + "+";
        StringBuilder sb = new StringBuilder();
        sb.append(hr).append('\n');
        sb.append(String.format("| %-" + (inner - 1) + "s|\n", s.labelHotovost()));
        sb.append(hr).append('\n');
        sb.append(String.format("| %-" + (c1-1) + "s| %" + (c2-1) + "s| %" + (c3-1) + "s|\n", s.colNominal(), s.colPocet(), s.colCastka()));
        sb.append(hr).append('\n');
        for (int i = 0; i < 12; i++)
            sb.append(String.format("| %-" + (c1-1) + "s| %" + (c2-1) + "s| %" + (c3-1) + "s|\n", labels[i], pcArr[i], amArr[i]));
        sb.append(hrJ).append('\n');
        sb.append(String.format("| %-" + (inner - totalVal.length() - 2) + "s%" + totalVal.length() + "s|\n", s.footCelkemHotovosti() + ":", totalVal));
        sb.append(hrJ).append('\n');
        return sb.toString();
    }

    private static String driverTable(ReportStrings s, List<DriverShift> shifts) {
        String kc = s.labelKc();
        int c1 = Math.max(s.labelDriver().length(), s.colDriver().length());
        int c2 = s.colStart().length(), c3 = s.colEnd().length(), c4 = s.colHours().length(), c5 = s.colKm().length();
        long totalMin = 0; double totalEarnings = 0;
        List<String[]> rows = new ArrayList<>();
        for (DriverShift ds : shifts) {
            String name  = ascii(ds.getDriverName() != null ? ds.getDriverName() : "");
            String start = ds.getStart() != null ? ds.getStart().format(DT_FMT) : "-";
            String end   = ds.getEnd()   != null ? ds.getEnd().format(DT_FMT)   : "-";
            long min = ds.getTotalMinutes(); totalMin += min; totalEarnings += ds.getEarnings();
            String hours = String.format("%d:%02d", min / 60, min % 60);
            String km    = ds.getDrivenKm() >= 0 ? ds.getDrivenKm() + " km" : "-";
            rows.add(new String[]{name, start, end, hours, km});
            c1=Math.max(c1,name.length()); c2=Math.max(c2,start.length()); c3=Math.max(c3,end.length()); c4=Math.max(c4,hours.length()); c5=Math.max(c5,km.length());
        }
        String thv = String.format("%d:%02d", totalMin/60, totalMin%60);
        String tev = String.format("%.0f " + kc, totalEarnings);
        c4=Math.max(c4,thv.length()); c5=Math.max(c5,tev.length());
        c1+=2; c2+=2; c3+=2; c4+=2; c5+=2;
        int inner = c1+c2+c3+c4+c5+4;
        String hr = "+" + rep('-',c1) + "+" + rep('-',c2) + "+" + rep('-',c3) + "+" + rep('-',c4) + "+" + rep('-',c5) + "+";
        String hrJ = "+" + rep('-', inner) + "+";
        StringBuilder sb = new StringBuilder();
        sb.append(hr).append('\n');
        sb.append(String.format("| %-" + (inner-1) + "s|\n", s.labelDriver()));
        sb.append(hr).append('\n');
        sb.append(String.format("| %-"+(c1-1)+"s| %-"+(c2-1)+"s| %-"+(c3-1)+"s| %-"+(c4-1)+"s| %-"+(c5-1)+"s|\n", s.colDriver(),s.colStart(),s.colEnd(),s.colHours(),s.colKm()));
        sb.append(hr).append('\n');
        for (String[] row : rows)
            sb.append(String.format("| %-"+(c1-1)+"s| %-"+(c2-1)+"s| %-"+(c3-1)+"s| %-"+(c4-1)+"s| %-"+(c5-1)+"s|\n", row[0],row[1],row[2],row[3],row[4]));
        sb.append(hrJ).append('\n');
        sb.append(String.format("| %-"+(inner-thv.length()-2)+"s%"+thv.length()+"s|\n", s.footCelkemSmen()+":", thv));
        sb.append(String.format("| %-"+(inner-tev.length()-2)+"s%"+tev.length()+"s|\n", s.footCelkemMzda()+":", tev));
        sb.append(hrJ).append('\n');
        return sb.toString();
    }

    private static String expenseTable(ReportStrings s, List<Expense> expenses, int total) {
        String kc = s.labelKc(), foot = s.footCelkemVydaje();
        int c1 = Math.max(s.labelVydaje().length(), Math.max(s.colOdberatel().length(), foot.length()));
        int c2 = s.colCastka().length();
        List<String[]> rows = new ArrayList<>();
        for (Expense v : expenses) {
            String n = ascii(v.getName() != null ? v.getName() : "");
            String val = v.getAmount() + " " + kc;
            c1=Math.max(c1,n.length()); c2=Math.max(c2,val.length()); rows.add(new String[]{n,val});
        }
        String footVal = total + " " + kc; c2=Math.max(c2,footVal.length());
        c1+=2; c2+=2; int inner=c1+c2+1;
        String hr="+" + rep('-',c1) + "+" + rep('-',c2) + "+";
        String hrJ="+" + rep('-',inner) + "+";
        StringBuilder sb=new StringBuilder();
        sb.append(hr).append('\n');
        sb.append(String.format("| %-"+(inner-1)+"s|\n",s.labelVydaje()));
        sb.append(hr).append('\n');
        sb.append(String.format("| %-"+(c1-1)+"s| %"+(c2-1)+"s|\n",s.colOdberatel(),s.colCastka()));
        sb.append(hr).append('\n');
        for (String[] row:rows) sb.append(String.format("| %-"+(c1-1)+"s| %"+(c2-1)+"s|\n",row[0],row[1]));
        sb.append(hrJ).append('\n');
        sb.append(String.format("| %-"+(inner-footVal.length()-2)+"s%"+footVal.length()+"s|\n",foot+":",footVal));
        sb.append(hrJ).append('\n');
        return sb.toString();
    }

    private static String totalTable(ReportStrings s, int expected, int actual, int diff) {
        String kc=s.labelKc(), left1=s.ocekPokladne(), left2=s.skutPokladne();
        String stav = diff>0 ? s.prebytek() : (diff<0 ? s.schodek() : s.souhlasi());
        String diffLine = String.format("%+d " + kc + "  ->  %s", diff, stav);
        int c1=Math.max(left1.length(),left2.length())+2;
        int c2=Math.max((expected+" "+kc).length(),(actual+" "+kc).length())+2;
        int inner=c1+c2+1;
        String hr="+" + rep('-',c1) + "+" + rep('-',c2) + "+";
        String hrJ="+" + rep('-',inner) + "+";
        StringBuilder sb=new StringBuilder();
        sb.append(hr).append('\n');
        sb.append(String.format("| %-"+(inner-1)+"s|\n",s.totalLabel()));
        sb.append(hr).append('\n');
        sb.append(String.format("| %-"+(c1-1)+"s| %"+(c2-1)+"s|\n",left1+":",expected+" "+kc));
        sb.append(String.format("| %-"+(c1-1)+"s| %"+(c2-1)+"s|\n",left2+":",actual+" "+kc));
        sb.append(hrJ).append('\n');
        sb.append(String.format("| %-"+(inner-1)+"s|\n",s.rozdilLabel()+" "+diffLine));
        sb.append(hrJ).append('\n');
        return sb.toString();
    }

    private static String countsTable(ReportStrings s, List<Invoice> all, List<Invoice> prevod,
                                      List<Invoice> nespl, List<Expense> expenses) {
        String kc=s.labelKc();
        String[][] rows = {{s.countFaktur(),String.valueOf(all.size())},{s.countPrevodem(),String.valueOf(prevod.size())},
                {s.countNespl(),String.valueOf(nespl.size())},{s.countVydaju(),String.valueOf(expenses.size())}};
        int total=all.size()+prevod.size()+nespl.size()+expenses.size();
        String footLabel=s.footCelkemPolozek(), footVal=total+" "+kc;
        int c1=Math.max(s.labelPoctyPolozek().length(),Math.max(s.colOdberatel().length(),footLabel.length()));
        int c2=Math.max(s.colCastka().length(),footVal.length());
        for (String[] row:rows) { c1=Math.max(c1,row[0].length()); c2=Math.max(c2,(row[1]+" "+kc).length()); }
        c1+=2; c2+=2; int inner=c1+c2+1;
        String hr="+" + rep('-',c1) + "+" + rep('-',c2) + "+";
        String hrJ="+" + rep('-',inner) + "+";
        StringBuilder sb=new StringBuilder();
        sb.append(hr).append('\n');
        sb.append(String.format("| %-"+(inner-1)+"s|\n",s.labelPoctyPolozek()));
        sb.append(hr).append('\n');
        sb.append(String.format("| %-"+(c1-1)+"s| %"+(c2-1)+"s|\n",s.colOdberatel(),s.colCastka()));
        sb.append(hr).append('\n');
        for (String[] row:rows) sb.append(String.format("| %-"+(c1-1)+"s| %"+(c2-1)+"s|\n",row[0],row[1]+" "+kc));
        sb.append(hrJ).append('\n');
        sb.append(String.format("| %-"+(inner-footVal.length()-2)+"s%"+footVal.length()+"s|\n",footLabel+":",footVal));
        sb.append(hrJ).append('\n');
        return sb.toString();
    }

    private static List<Invoice> filter(List<Invoice> all, PaymentType type, InvoiceStatus status) {
        List<Invoice> out=new ArrayList<>();
        for (Invoice f:all) {
            if (type!=null && f.getPaymentType()!=type) continue;
            if (status!=null && f.getStatus()!=status) continue;
            out.add(f);
        }
        return out;
    }

    static String ascii(String s) {
        if (s==null) return "";
        return Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+","")
                .replace('─','-').replace('│','|').replace('→','>').replace('–','-').replace('—','-');
    }

    static String rep(char ch, int n) {
        StringBuilder sb=new StringBuilder(n);
        for (int i=0;i<n;i++) sb.append(ch);
        return sb.toString();
    }
}

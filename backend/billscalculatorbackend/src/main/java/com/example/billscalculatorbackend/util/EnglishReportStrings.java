package com.example.billscalculatorbackend.util;

public class EnglishReportStrings implements ReportStrings {
    public String reportTitle()          { return "REPORT"; }
    public String labelFaktury()         { return "Invoices"; }
    public String labelPlatbyPrevodem()  { return "Bank transfers"; }
    public String labelNesplneneFaktury(){ return "Unpaid invoices"; }
    public String labelHotovost()        { return "Cash"; }
    public String labelDriver()          { return "Driver"; }
    public String labelVydaje()          { return "Expenses"; }
    public String labelPoctyPolozek()    { return "Item counts"; }
    public String labelKc()              { return "Kc"; }
    public String colOdberatel()         { return "Customer"; }
    public String colCastka()            { return "Amount"; }
    public String colDriver()            { return "Driver"; }
    public String colStart()             { return "Start"; }
    public String colEnd()               { return "End"; }
    public String colHours()             { return "Hours"; }
    public String colKm()                { return "Km"; }
    public String colNominal()           { return "Nominal"; }
    public String colPocet()             { return "Count"; }
    public String footCelkemFaktur()     { return "Total invoices"; }
    public String footCelkemPrevodem()   { return "Total transfers"; }
    public String footOcekHotov()        { return "Expected cash"; }
    public String footCelkemNesplnene()  { return "Total unpaid"; }
    public String footCelkemSmen()       { return "Total shifts"; }
    public String footCelkemMzda()       { return "Total wages"; }
    public String footCelkemVydaje()     { return "Total expenses"; }
    public String footCelkemHotovosti()  { return "Total cash"; }
    public String footCelkemPolozek()    { return "Total items"; }
    public String countFaktur()          { return "Invoice count"; }
    public String countPrevodem()        { return "Transfer count"; }
    public String countNespl()           { return "Unpaid count"; }
    public String countVydaju()          { return "Expense count"; }
    public String rowDrobne()            { return "Coins"; }
    public String ocekPokladne()         { return "Expected in register"; }
    public String skutPokladne()         { return "Actual in register"; }
    public String totalLabel()           { return "Balance"; }
    public String rozdilLabel()          { return "Difference"; }
    public String prebytek()             { return "SURPLUS"; }
    public String schodek()              { return "SHORTAGE"; }
    public String souhlasi()             { return "MATCHES"; }
}

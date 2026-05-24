package com.example.billscalculatorbackend.util;

public class RussianReportStrings implements ReportStrings {
    public String reportTitle()          { return "ОТЧЁТ"; }
    public String labelFaktury()         { return "Счета"; }
    public String labelPlatbyPrevodem()  { return "Банковские переводы"; }
    public String labelNesplneneFaktury(){ return "Неоплаченные счета"; }
    public String labelHotovost()        { return "Наличные"; }
    public String labelDriver()          { return "Водитель"; }
    public String labelVydaje()          { return "Расходы"; }
    public String labelPoctyPolozek()    { return "Количество позиций"; }
    public String labelKc()              { return "Kc"; }
    public String colOdberatel()         { return "Клиент"; }
    public String colCastka()            { return "Сумма"; }
    public String colDriver()            { return "Водитель"; }
    public String colStart()             { return "Начало"; }
    public String colEnd()               { return "Конец"; }
    public String colHours()             { return "Часы"; }
    public String colKm()                { return "Км"; }
    public String colNominal()           { return "Номинал"; }
    public String colPocet()             { return "Кол-во"; }
    public String footCelkemFaktur()     { return "Итого счетов"; }
    public String footCelkemPrevodem()   { return "Итого переводов"; }
    public String footOcekHotov()        { return "Ожидаемые наличные"; }
    public String footCelkemNesplnene()  { return "Итого неоплаченных"; }
    public String footCelkemSmen()       { return "Итого смен"; }
    public String footCelkemMzda()       { return "Итого заработок"; }
    public String footCelkemVydaje()     { return "Итого расходов"; }
    public String footCelkemHotovosti()  { return "Итого наличных"; }
    public String footCelkemPolozek()    { return "Итого позиций"; }
    public String countFaktur()          { return "Кол-во счетов"; }
    public String countPrevodem()        { return "Кол-во переводов"; }
    public String countNespl()           { return "Кол-во неоплаченных"; }
    public String countVydaju()          { return "Кол-во расходов"; }
    public String rowDrobne()            { return "Монеты"; }
    public String ocekPokladne()         { return "Ожидаемый остаток"; }
    public String skutPokladne()         { return "Фактический остаток"; }
    public String totalLabel()           { return "Баланс"; }
    public String rozdilLabel()          { return "Разница"; }
    public String prebytek()             { return "ИЗЛИШЕК"; }
    public String schodek()              { return "НЕДОСТАЧА"; }
    public String souhlasi()             { return "СОВПАДАЕТ"; }
}

export type TypPlatby = 'HOTOVOST' | 'PREVOD'
export type StatusFaktury = 'SPLNENA' | 'NESPLNENA'

export interface Polozka {
  id?: number
  nazev: string
  mnozstvi: number
  jcena: number
  jcenaBezDph: number
  cena: number
  dphProcent: number
  dphCastka: number
  kcCelkem: number
}

export interface Faktura {
  id?: number
  nazev: string
  castka: number
  typPlatby: TypPlatby
  status: StatusFaktury
  datum: string
  polozky: Polozka[]
  soucetDph?: number
  soucetKcCelkem?: number
  soucetCenaBezDph?: number
  soucetMnozstvi?: number
}

export interface FakturaFilter {
  nazev?: string
  typPlatby?: TypPlatby
  status?: StatusFaktury
  dateFrom?: string
  dateTo?: string
  amountMin?: number
  amountMax?: number
}

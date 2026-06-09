export interface Archive {
  id: number
  name: string
  createdAt: string
}

export interface ArchiveDetail extends Archive {
  data: string
}

export interface ArchiveInvoiceItem {
  nazev: string
  mnozstvi: number
  jcena: number
  jcenaBezDph: number
  cena: number
  dphProcent: number
  dphCastka: number
  kcCelkem: number
}

export interface ArchiveInvoice {
  nazev: string
  castka: number
  typ: 'HOTOVOST' | 'PREVOD'
  status: 'SPLNENA' | 'NESPLNENA'
  datum: string
  polozky: ArchiveInvoiceItem[]
}

export interface ArchiveExpense {
  nazev: string
  castka: number
}

export interface ArchiveCash {
  k5000: number
  k2000: number
  k1000: number
  k500: number
  k200: number
  k100: number
  k50: number
  k20: number
  k10: number
  k5: number
  k2: number
  k1: number
}

export interface ArchiveDriverShift {
  driverName: string
  start: string
  end: string
  kmStart: number
  kmEnd: number
  hourlyRate: number
}

export interface ArchiveAppData {
  faktury: ArchiveInvoice[]
  vydaje: ArchiveExpense[]
  driverShifts: ArchiveDriverShift[]
  hotovost: ArchiveCash
}

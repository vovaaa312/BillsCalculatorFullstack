export type PaymentType = 'HOTOVOST' | 'PREVOD'
export type InvoiceStatus = 'SPLNENA' | 'NESPLNENA'

export interface InvoiceItem {
  id?: number
  name: string
  quantity: number
  unitPrice: number
  unitPriceNoVat: number
  price: number
  vatPercent: number
  vatAmount: number
  totalPrice: number
}

export interface Invoice {
  id?: number
  name: string
  amount: number
  paymentType: PaymentType
  status: InvoiceStatus
  date: string
  items: InvoiceItem[]
  totalVat?: number
  totalPrice?: number
  totalPriceNoVat?: number
  totalQuantity?: number
  hasPdf?: boolean
}

export interface InvoiceFilter {
  name?: string
  paymentType?: PaymentType
  status?: InvoiceStatus
  dateFrom?: string
  dateTo?: string
  amountMin?: number
  amountMax?: number
}

import type { DocType, FieldKey, ProcurementDocument } from '../types'

export function formatNok(amount: number, fractionDigits = 0): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(amount)
}

export function formatCompactNok(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toLocaleString('nb-NO', { maximumFractionDigits: 1 })} mill. kr`
  }
  return formatNok(amount)
}

export function docTypeLabel(type: DocType): string {
  switch (type) {
    case 'purchase_order':
      return 'Purchase order'
    case 'order_confirmation':
      return 'Order confirmation'
    case 'delivery_note':
      return 'Delivery note'
    case 'invoice':
      return 'Invoice'
  }
}

export function docTypeShort(type: DocType): string {
  switch (type) {
    case 'purchase_order':
      return 'PO'
    case 'order_confirmation':
      return 'OC'
    case 'delivery_note':
      return 'DN'
    case 'invoice':
      return 'INV'
  }
}

export function fieldLabel(field: FieldKey): string {
  switch (field) {
    case 'docType':
      return 'Document type'
    case 'supplier':
      return 'Supplier'
    case 'poNumber':
      return 'PO number'
    case 'amount':
      return 'Amount'
    case 'date':
      return 'Date'
  }
}

export function fieldValue(doc: ProcurementDocument, field: FieldKey): string {
  switch (field) {
    case 'docType':
      return docTypeLabel(doc.docType)
    case 'supplier':
      return doc.supplier
    case 'poNumber':
      return doc.poNumber
    case 'amount':
      return formatNok(doc.amount)
    case 'date':
      return doc.date
  }
}

export function parseAmountInput(value: string): number | null {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(/\s/g, '').replace(',', '.')
  if (!cleaned) return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

export function confidencePct(value: number): string {
  return `${Math.round(value * 100)}%`
}

export const EXTRACT_FIELDS: FieldKey[] = [
  'docType',
  'supplier',
  'poNumber',
  'amount',
  'date',
]

export function toExtractionJson(doc: ProcurementDocument): string {
  return JSON.stringify(
    {
      documentType: doc.docType,
      supplier: doc.supplier,
      poNumber: doc.poNumber,
      amount: doc.amount,
      currency: doc.currency,
      date: doc.date,
      expectedDelivery: doc.expectedDelivery,
      lineItems: doc.lineItems,
      confidence: Number(doc.overallConfidence.toFixed(2)),
    },
    null,
    2,
  )
}

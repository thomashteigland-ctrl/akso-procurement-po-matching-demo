import type { ProcurementDocument, QueryKind } from '../types'

export function graphMeta(
  kind: QueryKind,
  question: string,
  supplier?: string,
): { name: string; description: string } {
  if (kind === 'spend') {
    return {
      name: supplier ? `Spend · ${supplier.split(' ')[0]}` : 'Spend by supplier',
      description: supplier
        ? `Total spend with ${supplier}.`
        : 'Total spend on completed invoices, by supplier.',
    }
  }
  if (kind === 'volume') {
    return {
      name: 'Order volume by supplier',
      description: 'Count of completed invoices per supplier.',
    }
  }
  if (kind === 'unitPrice') {
    return {
      name: 'Average unit price',
      description: 'Average unit price per product per supplier.',
    }
  }
  return {
    name: 'Untitled graph',
    description: question,
  }
}

export function matchQuery(input: string): QueryKind {
  const q = input.toLowerCase()
  if (/(unit price|unitprice|average|avg|product per|per product)/.test(q)) {
    return 'unitPrice'
  }
  if (/(volume|orders|count|how many|antall)/.test(q)) {
    return 'volume'
  }
  if (/(spend|total|cost|amount|nok|kr\b|forbruk)/.test(q)) {
    return 'spend'
  }
  return 'unknown'
}

export function mentionedSupplier(
  input: string,
  suppliers: string[],
): string | undefined {
  const q = input.toLowerCase()
  return suppliers.find((supplier) => {
    const parts = supplier.toLowerCase().split(/\s+/)
    return q.includes(supplier.toLowerCase()) || q.includes(parts[0])
  })
}

export function spendBySupplier(completed: ProcurementDocument[]) {
  const map = new Map<string, number>()
  for (const doc of completed) {
    if (doc.docType !== 'invoice') continue
    map.set(doc.supplier, (map.get(doc.supplier) ?? 0) + doc.amount)
  }
  return [...map.entries()]
    .map(([supplier, spend]) => ({ supplier, spend }))
    .sort((a, b) => b.spend - a.spend)
}

export function volumeBySupplier(completed: ProcurementDocument[]) {
  const map = new Map<string, number>()
  for (const doc of completed) {
    if (doc.docType !== 'invoice') continue
    map.set(doc.supplier, (map.get(doc.supplier) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([supplier, volume]) => ({ supplier, volume }))
    .sort((a, b) => b.volume - a.volume)
}

export interface UnitPriceRow {
  supplier: string
  product: string
  avgUnitPrice: number
  quantity: number
}

export function avgUnitPrice(completed: ProcurementDocument[]): UnitPriceRow[] {
  const acc = new Map<string, { sum: number; qty: number; supplier: string; product: string }>()
  for (const doc of completed) {
    if (doc.docType !== 'invoice') continue
    for (const item of doc.lineItems) {
      const key = `${doc.supplier}::${item.product}`
      const current = acc.get(key) ?? {
        sum: 0,
        qty: 0,
        supplier: doc.supplier,
        product: item.product,
      }
      current.sum += item.unitPrice * item.quantity
      current.qty += item.quantity
      acc.set(key, current)
    }
  }
  return [...acc.values()]
    .map((row) => ({
      supplier: row.supplier,
      product: row.product,
      avgUnitPrice: row.qty === 0 ? 0 : row.sum / row.qty,
      quantity: row.qty,
    }))
    .sort((a, b) => a.supplier.localeCompare(b.supplier) || a.product.localeCompare(b.product))
}

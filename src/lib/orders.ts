import { docTypeLabel, formatNok } from './format'
import type {
  DocType,
  Order,
  OrderDiscrepancy,
  OrderLineSuperset,
  OrderStage,
  ProcurementDocument,
} from '../types'

const STAGE_SEQUENCE: DocType[] = [
  'purchase_order',
  'order_confirmation',
  'delivery_note',
  'invoice',
]

export const STAGE_LABEL: Record<OrderStage, string> = {
  po_created: 'PO created',
  confirmed: 'Confirmed',
  delivered: 'Delivered',
  invoiced: 'Invoiced',
}

export const STAGE_FROM_DOC: Record<DocType, OrderStage> = {
  purchase_order: 'po_created',
  order_confirmation: 'confirmed',
  delivery_note: 'delivered',
  invoice: 'invoiced',
}

function uniqueDocsByType(docs: ProcurementDocument[]): ProcurementDocument[] {
  const ranked = [...docs].sort((a, b) => {
    const ac = a.id.includes('-c') ? 1 : 0
    const bc = b.id.includes('-c') ? 1 : 0
    return ac - bc
  })
  const map = new Map<DocType, ProcurementDocument>()
  for (const doc of ranked) {
    if (!map.has(doc.docType)) map.set(doc.docType, doc)
  }
  return STAGE_SEQUENCE.map((type) => map.get(type)).filter(
    (doc): doc is ProcurementDocument => Boolean(doc),
  )
}

function deriveStage(documents: ProcurementDocument[]): OrderStage {
  let stage: OrderStage = 'po_created'
  for (const doc of documents) {
    const next = STAGE_FROM_DOC[doc.docType]
    if (stageIndex(next) > stageIndex(stage)) stage = next
  }
  return stage
}

export function stageIndex(stage: OrderStage): number {
  return ['po_created', 'confirmed', 'delivered', 'invoiced'].indexOf(stage)
}

function lineSuperset(documents: ProcurementDocument[]): OrderLineSuperset[] {
  const products: string[] = []
  for (const doc of documents) {
    for (const item of doc.lineItems) {
      if (!products.includes(item.product)) products.push(item.product)
    }
  }

  return products.map((product) => {
    const byType: OrderLineSuperset['byType'] = {}
    const quantities = new Set<number>()
    const prices = new Set<number>()
    for (const doc of documents) {
      const item = doc.lineItems.find((row) => row.product === product)
      if (!item) continue
      byType[doc.docType] = { quantity: item.quantity, unitPrice: item.unitPrice }
      quantities.add(item.quantity)
      prices.add(item.unitPrice)
    }
    return {
      product,
      byType,
      mismatch: quantities.size > 1 || prices.size > 1,
    }
  })
}

function discrepancies(documents: ProcurementDocument[]): OrderDiscrepancy[] {
  const issues: OrderDiscrepancy[] = []
  const po = documents.find((doc) => doc.docType === 'purchase_order')
  const present = new Set(documents.map((doc) => doc.docType))
  const furthest = deriveStage(documents)
  const furthestIdx = stageIndex(furthest)
  const hasPo = present.has('purchase_order')

  if (hasPo) {
    for (let i = 1; i < furthestIdx; i += 1) {
      const type = STAGE_SEQUENCE[i]
      if (!present.has(type)) {
        issues.push({
          field: 'missing',
          docType: type,
          message:
            furthestIdx > i
              ? `${docTypeLabel(type)} never received`
              : `${docTypeLabel(type)} not received yet`,
        })
      }
    }
  }

  for (const doc of documents) {
    if (po && doc.docType !== 'purchase_order' && doc.amount !== po.amount) {
      const pct = ((doc.amount - po.amount) / po.amount) * 100
      const signed = `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`
      const oc = documents.find((item) => item.docType === 'order_confirmation')
      const matchesConfirmation = oc != null && oc.amount === po.amount
      const versus =
        doc.docType === 'delivery_note' && matchesConfirmation
          ? `PO and confirmation ${formatNok(po.amount)}`
          : `PO ${formatNok(po.amount)}`
      issues.push({
        field: 'amount',
        docType: doc.docType,
        message: `${docTypeLabel(doc.docType)} amount ${formatNok(doc.amount)} vs ${versus} (${signed})`,
      })
    }
    if (doc.flagged) {
      issues.push({
        field: 'confidence',
        docType: doc.docType,
        message: doc.flagReason ?? `${docTypeLabel(doc.docType)} flagged for review`,
      })
    }
  }

  for (const line of lineSuperset(documents)) {
    if (!line.mismatch) continue
    issues.push({
      field: 'lineItem',
      message: `Quantity or unit price for “${line.product}” differs across documents`,
    })
  }

  return issues
}

export function buildOrders(docs: ProcurementDocument[]): Order[] {
  const byPo = new Map<string, ProcurementDocument[]>()
  for (const doc of docs) {
    const list = byPo.get(doc.poNumber) ?? []
    list.push(doc)
    byPo.set(doc.poNumber, list)
  }

  return [...byPo.entries()]
    .map(([poNumber, all]) => {
      const documents = uniqueDocsByType(all)
      const po = documents.find((doc) => doc.docType === 'purchase_order')
      const first = po ?? documents[0]
      return {
        poNumber,
        supplier: first.supplier,
        orderDate: po?.date ?? first.date,
        expectedDelivery: first.expectedDelivery,
        amount: po?.amount ?? first.amount,
        stage: deriveStage(documents),
        documents,
        discrepancies: discrepancies(documents),
        lineItems: lineSuperset(documents),
      }
    })
    .sort((a, b) => dateKey(a.orderDate).localeCompare(dateKey(b.orderDate)))
}

function dateKey(value: string): string {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value)
  if (!match) return value
  return `${match[3]}-${match[2]}-${match[1]}`
}

import { BATCH_SIZE, REVIEW_QUEUE_SIZE, UNIQUE_PO_CYCLES } from '../lib/constants'
import type {
  DocType,
  FieldKey,
  LineItem,
  ProcurementDocument,
} from '../types'

const NORDISK = 'Nordisk Stål AS'
const VESTLAND = 'Vestland Logistikk'
const FJORDPACK = 'Fjordpack AS'
const ARCTIC = 'Arctic Components'
const OSLO = 'Oslo Industri'
const SHIP_TO = 'AKSO lager, Drammen'

const EXPECTED_DELIVERY: Record<string, string> = {
  'PO-2026-0841': '12.03.2026',
  'PO-2026-0912': '28.03.2026',
  'PO-2026-0733': '20.02.2026',
  'PO-2026-1104': '10.04.2026',
  'PO-2026-0528': '30.01.2026',
  'PO-2026-0842': '27.03.2026',
  'PO-2026-0918': '15.04.2026',
  'PO-2026-0751': '04.03.2026',
}

const HIGH = {
  docType: 0.97,
  supplier: 0.95,
  poNumber: 0.96,
  amount: 0.94,
  date: 0.93,
} as const

interface DocInput {
  id: string
  docType: DocType
  supplier: string
  poNumber: string
  amount: number
  date: string
  lineItems: LineItem[]
  flaggedFields?: FieldKey[]
  flagReason?: string
  confidenceOverrides?: Partial<Record<FieldKey, number>>
}

function fileName(docType: DocType, supplier: string, poNumber: string): string {
  const prefix: Record<DocType, string> = {
    purchase_order: 'PO',
    order_confirmation: 'OC',
    delivery_note: 'DN',
    invoice: 'INV',
  }
  const slug = supplier.split(' ')[0]
  return `${prefix[docType]}_${slug}_${poNumber}.pdf`
}

function make(input: DocInput): ProcurementDocument {
  const fieldConfidence: Record<FieldKey, number> = {
    ...HIGH,
    ...input.confidenceOverrides,
  }
  const flaggedFields = input.flaggedFields ?? []
  const flagged = flaggedFields.length > 0
  const overallConfidence = flagged
    ? Math.min(...flaggedFields.map((field) => fieldConfidence[field]))
    : Number(
        (
          (fieldConfidence.docType +
            fieldConfidence.supplier +
            fieldConfidence.poNumber +
            fieldConfidence.amount +
            fieldConfidence.date) /
          5
        ).toFixed(2),
      )

  return {
    id: input.id,
    fileName: fileName(input.docType, input.supplier, input.poNumber),
    docType: input.docType,
    supplier: input.supplier,
    poNumber: input.poNumber,
    amount: input.amount,
    currency: 'NOK',
    date: input.date,
    shipTo: SHIP_TO,
    expectedDelivery: EXPECTED_DELIVERY[input.poNumber] ?? input.date,
    lineItems: input.lineItems,
    fieldConfidence,
    overallConfidence,
    flagged,
    flaggedFields,
    flagReason: input.flagReason,
  }
}

const items = {
  po0841: [
    { product: 'Stålplate 8mm', quantity: 24, unitPrice: 4175 },
    { product: 'Vinkeljern 50x50', quantity: 40, unitPrice: 1200 },
  ],
  po0912: [
    { product: 'Transport pall', quantity: 50, unitPrice: 850 },
    { product: 'Express Oslo–Bergen', quantity: 15, unitPrice: 2450 },
    { product: 'Lagring / uke', quantity: 8, unitPrice: 1000 },
  ],
  po0733: [
    { product: 'Kartong 600×400', quantity: 2000, unitPrice: 48 },
    { product: 'Stretchfilm', quantity: 80, unitPrice: 385 },
    { product: 'Pallehette', quantity: 400, unitPrice: 220 },
  ],
  po1104: [
    { product: 'Kulelager 6205', quantity: 120, unitPrice: 187 },
    { product: 'Pakning NBR', quantity: 300, unitPrice: 42 },
    { product: 'Motor 1.5kW', quantity: 6, unitPrice: 3550 },
  ],
  po1104dn: [
    { product: 'Kulelager 6205', quantity: 120, unitPrice: 187 },
    { product: 'Pakning NBR', quantity: 300, unitPrice: 42 },
    { product: 'Motor 1.5kW', quantity: 5, unitPrice: 3550 },
  ],
  po0528: [
    { product: 'Hydraulikkslange', quantity: 48, unitPrice: 1850 },
    { product: 'Filterelement', quantity: 80, unitPrice: 620 },
    { product: 'Kobling 1/2"', quantity: 64, unitPrice: 800 },
  ],
  po0842: [
    { product: 'Sveiseelektrode', quantity: 200, unitPrice: 186.5 },
    { product: 'Stålplate 12mm', quantity: 12, unitPrice: 5000 },
  ],
  po0918: [
    { product: 'Express Oslo–Bergen', quantity: 30, unitPrice: 2450 },
    { product: 'Transport pall', quantity: 60, unitPrice: 850 },
  ],
  po0751: [
    { product: 'Kartong 600×400', quantity: 780, unitPrice: 48 },
    { product: 'Stretchfilm', quantity: 40, unitPrice: 385 },
    { product: 'Pallehette', quantity: 68, unitPrice: 220 },
  ],
  po0751dn: [
    { product: 'Kartong 600×400', quantity: 720, unitPrice: 48 },
    { product: 'Stretchfilm', quantity: 40, unitPrice: 385 },
    { product: 'Pallehette', quantity: 68, unitPrice: 220 },
  ],
} as const satisfies Record<string, LineItem[]>

/** Showcase-first order: a clean PO→invoice flow, then mixed completes and flags. */
export const DOCUMENTS: ProcurementDocument[] = [
  make({
    id: 'po-0841',
    docType: 'purchase_order',
    supplier: NORDISK,
    poNumber: 'PO-2026-0841',
    amount: 148200,
    date: '03.03.2026',
    lineItems: items.po0841,
  }),
  make({
    id: 'oc-0841',
    docType: 'order_confirmation',
    supplier: NORDISK,
    poNumber: 'PO-2026-0841',
    amount: 148200,
    date: '04.03.2026',
    lineItems: items.po0841,
  }),
  make({
    id: 'dn-0841',
    docType: 'delivery_note',
    supplier: NORDISK,
    poNumber: 'PO-2026-0841',
    amount: 148200,
    date: '11.03.2026',
    lineItems: items.po0841,
  }),
  make({
    id: 'inv-0841',
    docType: 'invoice',
    supplier: NORDISK,
    poNumber: 'PO-2026-0841',
    amount: 148200,
    date: '12.03.2026',
    lineItems: items.po0841,
  }),
  make({
    id: 'po-0912',
    docType: 'purchase_order',
    supplier: VESTLAND,
    poNumber: 'PO-2026-0912',
    amount: 87250,
    date: '18.03.2026',
    lineItems: items.po0912,
  }),
  make({
    id: 'dn-0912',
    docType: 'delivery_note',
    supplier: VESTLAND,
    poNumber: 'PO-2026-0912',
    amount: 87250,
    date: '??.03.2026',
    lineItems: items.po0912,
    flaggedFields: ['date'],
    flagReason: 'Delivery date unreadable on scan',
    confidenceOverrides: { date: 0.41 },
  }),
  make({
    id: 'inv-0733',
    docType: 'invoice',
    supplier: FJORDPACK,
    poNumber: 'PO-2026-0733',
    amount: 214800,
    date: '22.02.2026',
    lineItems: items.po0733,
  }),
  make({
    id: 'oc-0733',
    docType: 'order_confirmation',
    supplier: FJORDPACK,
    poNumber: 'PO-2026-0733',
    amount: 214800,
    date: '09.02.2026',
    lineItems: items.po0733,
    flaggedFields: ['supplier'],
    flagReason: 'Supplier name low confidence',
    confidenceOverrides: { supplier: 0.58 },
  }),
  make({
    id: 'po-1104',
    docType: 'purchase_order',
    supplier: ARCTIC,
    poNumber: 'PO-2026-1104',
    amount: 56340,
    date: '01.04.2026',
    lineItems: items.po1104,
  }),
  make({
    id: 'inv-0842',
    docType: 'invoice',
    supplier: NORDISK,
    poNumber: 'PO-2026-0842',
    amount: 101386,
    date: '28.03.2026',
    lineItems: items.po0842,
    flaggedFields: ['amount'],
    flagReason: 'Amount differs from PO by 4.2%',
    confidenceOverrides: { amount: 0.61 },
  }),
  make({
    id: 'oc-0912',
    docType: 'order_confirmation',
    supplier: VESTLAND,
    poNumber: 'PO-2026-0912',
    amount: 87250,
    date: '19.03.2026',
    lineItems: items.po0912,
  }),
  make({
    id: 'inv-0912',
    docType: 'invoice',
    supplier: VESTLAND,
    poNumber: 'PO-2026-0912',
    amount: 87250,
    date: '02.04.2026',
    lineItems: items.po0912,
  }),
  make({
    id: 'po-0733',
    docType: 'purchase_order',
    supplier: FJORDPACK,
    poNumber: 'PO-2026-0733',
    amount: 214800,
    date: '08.02.2026',
    lineItems: items.po0733,
  }),
  make({
    id: 'dn-0733',
    docType: 'delivery_note',
    supplier: FJORDPACK,
    poNumber: 'PO-2026-0733',
    amount: 214800,
    date: '20.02.2026',
    lineItems: items.po0733,
  }),
  make({
    id: 'oc-1104',
    docType: 'order_confirmation',
    supplier: ARCTIC,
    poNumber: 'PO-2026-1104',
    amount: 56340,
    date: '02.04.2026',
    lineItems: items.po1104,
  }),
  make({
    id: 'dn-1104',
    docType: 'delivery_note',
    supplier: ARCTIC,
    poNumber: 'PO-2026-1104',
    amount: 52790,
    date: '08.04.2026',
    lineItems: items.po1104dn,
  }),
  make({
    id: 'inv-1104',
    docType: 'invoice',
    supplier: ARCTIC,
    poNumber: 'PO-2026-1104',
    amount: 59157,
    date: '09.04.2026',
    lineItems: items.po1104,
    flaggedFields: ['poNumber', 'amount'],
    flagReason: 'PO number uncertain; amount does not match PO',
    confidenceOverrides: { poNumber: 0.63, amount: 0.55 },
  }),
  make({
    id: 'po-0528',
    docType: 'purchase_order',
    supplier: OSLO,
    poNumber: 'PO-2026-0528',
    amount: 189600,
    date: '14.01.2026',
    lineItems: items.po0528,
    flaggedFields: ['amount'],
    flagReason: 'Amount low confidence (scan quality)',
    confidenceOverrides: { amount: 0.49 },
  }),
  make({
    id: 'oc-0528',
    docType: 'order_confirmation',
    supplier: OSLO,
    poNumber: 'PO-2026-0528',
    amount: 189600,
    date: '15.01.2026',
    lineItems: items.po0528,
  }),
  make({
    id: 'dn-0528',
    docType: 'delivery_note',
    supplier: OSLO,
    poNumber: 'PO-2026-0528',
    amount: 189600,
    date: '29.01.2026',
    lineItems: items.po0528,
  }),
  make({
    id: 'inv-0528',
    docType: 'invoice',
    supplier: OSLO,
    poNumber: 'PO-2026-0528',
    amount: 189600,
    date: '02.02.2026',
    lineItems: items.po0528,
  }),
  make({
    id: 'po-0842',
    docType: 'purchase_order',
    supplier: NORDISK,
    poNumber: 'PO-2026-0842',
    amount: 97300,
    date: '16.03.2026',
    lineItems: items.po0842,
  }),
  make({
    id: 'oc-0842',
    docType: 'order_confirmation',
    supplier: NORDISK,
    poNumber: 'PO-2026-0842',
    amount: 97300,
    date: '17.03.2026',
    lineItems: items.po0842,
  }),
  make({
    id: 'dn-0842',
    docType: 'delivery_note',
    supplier: NORDISK,
    poNumber: 'PO-2026-0842',
    amount: 97300,
    date: '26.03.2026',
    lineItems: items.po0842,
  }),
  make({
    id: 'po-0918',
    docType: 'purchase_order',
    supplier: VESTLAND,
    poNumber: 'PO-2026-0918',
    amount: 124500,
    date: '05.04.2026',
    lineItems: items.po0918,
  }),
  make({
    id: 'oc-0918',
    docType: 'order_confirmation',
    supplier: VESTLAND,
    poNumber: 'PO-2026-0918',
    amount: 124500,
    date: '06.04.2026',
    lineItems: items.po0918,
  }),
  make({
    id: 'inv-0918',
    docType: 'invoice',
    supplier: VESTLAND,
    poNumber: 'PO-2026-0918',
    amount: 124500,
    date: '15.04.2026',
    lineItems: items.po0918,
  }),
  make({
    id: 'po-0751',
    docType: 'purchase_order',
    supplier: FJORDPACK,
    poNumber: 'PO-2026-0751',
    amount: 67800,
    date: '21.02.2026',
    lineItems: items.po0751,
  }),
  make({
    id: 'oc-0751',
    docType: 'order_confirmation',
    supplier: FJORDPACK,
    poNumber: 'PO-2026-0751',
    amount: 67800,
    date: '22.02.2026',
    lineItems: items.po0751,
  }),
  make({
    id: 'dn-0751',
    docType: 'delivery_note',
    supplier: FJORDPACK,
    poNumber: 'PO-2026-0751',
    amount: 64920,
    date: '03.03.2026',
    lineItems: items.po0751dn,
  }),
  make({
    id: 'inv-0751',
    docType: 'invoice',
    supplier: FJORDPACK,
    poNumber: 'PO-2026-0751',
    amount: 67800,
    date: '04.03.2026',
    lineItems: items.po0751,
  }),
]

export const SUPPLIERS = [NORDISK, VESTLAND, FJORDPACK, ARCTIC, OSLO]

const DOC_TYPE_INDEX: Record<DocType, number> = {
  purchase_order: 0,
  order_confirmation: 1,
  delivery_note: 2,
  invoice: 3,
}

/** Extra PO suffixes walk this mix so Orders is not all invoiced. */
const STAGE_MIX = [0, 1, 2, 3, 0, 1, 2]

const FLAGGED_FLOOR_BY_PO: Record<string, number> = {}
for (const doc of DOCUMENTS) {
  if (!doc.flagged) continue
  FLAGGED_FLOOR_BY_PO[doc.poNumber] = Math.max(
    FLAGGED_FLOOR_BY_PO[doc.poNumber] ?? 0,
    DOC_TYPE_INDEX[doc.docType],
  )
}

function cyclePoNumber(poNumber: string, cycle: number): string {
  const suffix = cycle % UNIQUE_PO_CYCLES
  if (suffix === 0) return poNumber
  return `${poNumber}-${String(suffix).padStart(2, '0')}`
}

function poNumeric(poNumber: string): number {
  return Number(poNumber.replace(/\D/g, '').slice(-4)) || 0
}

/** Highest document type to keep for this PO variant (0 = PO only … 3 = invoiced). */
function orderStageCap(basePo: string, suffix: number): number {
  const flaggedFloor = FLAGGED_FLOOR_BY_PO[basePo] ?? 0
  if (suffix === 0) return 3
  const mixed = STAGE_MIX[(suffix - 1 + poNumeric(basePo)) % STAGE_MIX.length]
  return Math.max(mixed, flaggedFloor)
}

export function buildBatch(droppedNames: string[] = []): ProcurementDocument[] {
  const batch: ProcurementDocument[] = []
  let i = 0
  let reviewCount = 0
  while (batch.length < BATCH_SIZE) {
    const src = DOCUMENTS[i % DOCUMENTS.length]
    const cycle = Math.floor(i / DOCUMENTS.length)
    const suffix = cycle % UNIQUE_PO_CYCLES
    i += 1
    if (DOC_TYPE_INDEX[src.docType] > orderStageCap(src.poNumber, suffix)) continue

    const overlayName = droppedNames[batch.length]
    const keepFlag = src.flagged && reviewCount < REVIEW_QUEUE_SIZE
    if (keepFlag) reviewCount += 1
    batch.push({
      ...src,
      lineItems: src.lineItems.map((item) => ({ ...item })),
      fieldConfidence: keepFlag ? { ...src.fieldConfidence } : { ...HIGH },
      flaggedFields: keepFlag ? [...src.flaggedFields] : [],
      flagReason: keepFlag ? src.flagReason : undefined,
      flagged: keepFlag,
      overallConfidence: keepFlag ? src.overallConfidence : 0.94,
      id: cycle === 0 ? src.id : `${src.id}-c${cycle}`,
      poNumber: cyclePoNumber(src.poNumber, cycle),
      fileName:
        overlayName ??
        (cycle === 0 ? src.fileName : src.fileName.replace('.pdf', `-${String(suffix).padStart(2, '0')}.pdf`)),
    })
  }
  return batch
}

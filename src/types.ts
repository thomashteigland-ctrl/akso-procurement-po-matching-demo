export type DocType =
  | 'purchase_order'
  | 'order_confirmation'
  | 'delivery_note'
  | 'invoice'

export type OrderStage = 'po_created' | 'confirmed' | 'delivered' | 'invoiced'

export type FieldKey = 'docType' | 'supplier' | 'poNumber' | 'amount' | 'date'

export interface LineItem {
  product: string
  quantity: number
  unitPrice: number
}

export interface ProcurementDocument {
  id: string
  fileName: string
  docType: DocType
  supplier: string
  poNumber: string
  amount: number
  currency: 'NOK'
  date: string
  shipTo: string
  expectedDelivery: string
  lineItems: LineItem[]
  fieldConfidence: Record<FieldKey, number>
  overallConfidence: number
  flagged: boolean
  flaggedFields: FieldKey[]
  flagReason?: string
}

export interface OrderDiscrepancy {
  field: string
  message: string
  docType?: DocType
}

export interface OrderLineSuperset {
  product: string
  byType: Partial<Record<DocType, { quantity: number; unitPrice: number }>>
  mismatch: boolean
}

export interface Order {
  poNumber: string
  supplier: string
  orderDate: string
  expectedDelivery: string
  amount: number
  stage: OrderStage
  documents: ProcurementDocument[]
  discrepancies: OrderDiscrepancy[]
  lineItems: OrderLineSuperset[]
}

export type AppScreen =
  | 'intake'
  | 'processing'
  | 'orders'
  | 'dataset'
  | 'review'
  | 'talk'
  | 'architecture'

export type ExtractionStatus = 'extracting' | 'completed' | 'flagged'

export type QueryKind = 'spend' | 'volume' | 'unitPrice' | 'unknown'

export interface ModelVote {
  model: string
  confidence: number
}

export interface MappingResult {
  ocrConfidence: number
  models: ModelVote[]
  ensemble: number
  agreeCount: number
  fieldConfidence: Record<FieldKey, number>
}

export interface SavedGraph {
  id: string
  name: string
  description: string
  question: string
  kind: QueryKind
  supplier?: string
  dashboardId?: string
}

export interface SavedDashboard {
  id: string
  name: string
  description: string
  graphIds: string[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

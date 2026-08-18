import { FileText, Minus, Plus } from 'lucide-react'
import { docTypeShort, formatNok } from '../lib/format'
import type { DocType, ProcurementDocument } from '../types'

const TITLES: Record<DocType, string> = {
  purchase_order: 'INNKJØPSORDRE',
  order_confirmation: 'ORDREBEKREFTELSE',
  delivery_note: 'FØLGESSEDEL',
  invoice: 'FAKTURA',
}

function Barcode() {
  return (
    <div className="mt-4 flex h-7 items-end gap-px overflow-hidden opacity-70">
      {Array.from({ length: 48 }, (_, i) => (
        <span
          key={i}
          className="bg-[#1a1510]"
          style={{
            width: i % 7 === 0 ? 2 : 1,
            height: `${10 + ((i * 13) % 16)}px`,
          }}
        />
      ))}
    </div>
  )
}

export function DocumentPreview({
  doc,
  compact = false,
}: {
  doc: ProcurementDocument
  compact?: boolean
}) {
  const title = TITLES[doc.docType]
  const fromSupplier =
    doc.docType === 'invoice' ||
    doc.docType === 'order_confirmation' ||
    doc.docType === 'delivery_note'
  const issuer = fromSupplier ? doc.supplier : 'AKSO AS'
  const recipient = fromSupplier ? 'AKSO AS, Drammen' : doc.supplier
  const smudged = doc.date.includes('?')

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg bg-[#3c4043] shadow-[0_16px_40px_rgba(8,30,50,0.28)]">
      <div className="flex shrink-0 items-center gap-2 px-3 py-1.5 text-[11px] text-white/80">
        <FileText className="size-3.5" />
        <span className="min-w-0 truncate font-mono">{doc.fileName}</span>
        <span className="ml-auto flex items-center gap-2 text-white/50">
          <Minus className="size-3" />
          100%
          <Plus className="size-3" />
          <span>1 / 1</span>
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-[#525659] p-4">
        <article
          className={`paper-scan font-serif mx-auto w-full max-w-[28rem] origin-top text-[#1a1510] ${
            compact ? 'p-4 text-[10px]' : 'p-6 text-[11px]'
          }`}
          style={{ transform: 'rotate(-0.35deg)' }}
        >
          <header className="flex items-start justify-between border-b border-[#1a1510]/25 pb-3">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.22em] uppercase">{issuer}</p>
              <p className={`${compact ? 'text-base' : 'text-xl'} mt-1 font-bold tracking-wide`}>
                {title}
              </p>
              <p className="mt-1 text-[10px] opacity-70">Org.nr 912 334 018 MVA</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] tracking-widest uppercase opacity-60">{docTypeShort(doc.docType)}</p>
              <p className="font-mono text-[11px]">{doc.poNumber}</p>
              <p className={`mt-1 font-mono ${smudged ? 'bg-[#1a1510]/20 italic blur-[0.4px]' : ''}`}>
                {doc.date}
              </p>
            </div>
          </header>

          <div className={`mt-3 grid grid-cols-2 gap-x-4 gap-y-1 ${compact ? '' : 'text-[11px]'}`}>
            <div>
              <p className="text-[9px] tracking-wide uppercase opacity-55">Til</p>
              <p className="font-semibold">{recipient}</p>
              <p className="opacity-70">{fromSupplier ? 'Støperigata 1, 3002 Drammen' : 'Norge'}</p>
            </div>
            <div>
              <p className="text-[9px] tracking-wide uppercase opacity-55">Fra</p>
              <p className="font-semibold">{issuer}</p>
              <p className="opacity-70">Forventet levering: {doc.expectedDelivery}</p>
            </div>
          </div>

          <table className="mt-4 w-full border-collapse">
            <thead>
              <tr className="border-y border-[#1a1510]/30 text-left text-[9px] tracking-wide uppercase opacity-60">
                <th className="py-1 font-semibold">Vare</th>
                <th className="py-1 text-right font-semibold">Ant</th>
                {!compact && <th className="py-1 text-right font-semibold">Pris</th>}
                <th className="py-1 text-right font-semibold">Sum</th>
              </tr>
            </thead>
            <tbody>
              {doc.lineItems.map((item) => (
                <tr key={item.product} className="border-b border-[#1a1510]/15">
                  <td className="py-1 pr-2">{item.product}</td>
                  <td className="py-1 text-right font-mono">{item.quantity}</td>
                  {!compact && (
                    <td className="py-1 text-right font-mono">{formatNok(item.unitPrice)}</td>
                  )}
                  <td className="py-1 text-right font-mono">
                    {formatNok(item.quantity * item.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex items-end justify-between">
            {doc.docType === 'delivery_note' ? (
              <p className="rotate-[-8deg] border-2 border-red-800/80 px-2 py-0.5 text-[10px] font-bold tracking-widest text-red-800/80 uppercase">
                Mottatt
              </p>
            ) : (
              <p className="max-w-[50%] text-[9px] opacity-50">
                Side 1 av 1 · Skannet PDF
              </p>
            )}
            <div className="text-right">
              <p className="text-[9px] tracking-wide uppercase opacity-55">Total NOK</p>
              <p className={`${compact ? 'text-base' : 'text-lg'} font-bold`}>
                {formatNok(doc.amount)}
              </p>
            </div>
          </div>
          {!compact && <Barcode />}
        </article>
      </div>
    </div>
  )
}

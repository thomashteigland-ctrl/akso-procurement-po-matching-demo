import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCompactNok, formatNok } from '../lib/format'
import { avgUnitPrice, spendBySupplier, volumeBySupplier } from '../lib/queryMatcher'
import type { ProcurementDocument, SavedGraph } from '../types'

function shortSupplier(name: string) {
  return name.replace(' AS', '').split(' ')[0]
}

export function DataChart({
  graph,
  completed,
  compact = false,
}: {
  graph: SavedGraph
  completed: ProcurementDocument[]
  compact?: boolean
}) {
  const spend = spendBySupplier(completed)
  const volume = volumeBySupplier(completed)
  const prices = avgUnitPrice(completed)
  const highlighted = graph.supplier
    ? spend.find((row) => row.supplier === graph.supplier)
    : undefined
  const height = compact ? 'h-40' : 'h-full min-h-64'

  if (graph.kind === 'unknown') {
    return <p className="text-sm text-muted">This question did not match a known chart.</p>
  }

  if (graph.kind === 'unitPrice') {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
          {graph.name}
        </p>
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-line">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-paper text-[10px] tracking-wide text-muted uppercase">
              <tr>
                <th className="px-3 py-2 font-medium">Supplier</th>
                <th className="px-3 py-2 font-medium">Product</th>
                <th className="px-3 py-2 text-right font-medium">Avg unit price</th>
                {!compact && <th className="px-3 py-2 text-right font-medium">Qty</th>}
              </tr>
            </thead>
            <tbody>
              {prices.map((row) => (
                <tr key={`${row.supplier}-${row.product}`} className="border-t border-line">
                  <td className="px-3 py-1.5 font-medium">{row.supplier}</td>
                  <td className="px-3 py-1.5">{row.product}</td>
                  <td className="px-3 py-1.5 text-right font-mono">
                    {formatNok(row.avgUnitPrice, 2)}
                  </td>
                  {!compact && (
                    <td className="px-3 py-1.5 text-right font-mono">
                      {row.quantity.toLocaleString('nb-NO')}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (graph.kind === 'volume') {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <p className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">{graph.name}</p>
        <div className={height}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={volume} margin={{ top: 8, right: 8, left: 4, bottom: 8 }}>
              <CartesianGrid stroke="#c5d8e6" vertical={false} />
              <XAxis
                dataKey="supplier"
                tickFormatter={shortSupplier}
                tick={{ fontSize: 11, fill: '#5c7388' }}
              />
              <YAxis tick={{ fontSize: 11, fill: '#5c7388' }} width={40} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="volume" fill="#A9E0FF" radius={[4, 4, 0, 0]} maxBarSize={compact ? 36 : 56} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <p className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">{graph.name}</p>
      {highlighted && (
        <p className="mb-2 text-sm text-ink-soft">
          {highlighted.supplier}:{' '}
          <span className="font-semibold text-ink">{formatNok(highlighted.spend)}</span>
        </p>
      )}
      <div className={height}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={spend} margin={{ top: 8, right: 8, left: 4, bottom: 8 }}>
            <CartesianGrid stroke="#c5d8e6" vertical={false} />
            <XAxis
              dataKey="supplier"
              tickFormatter={shortSupplier}
              tick={{ fontSize: 11, fill: '#5c7388' }}
            />
            <YAxis
              tickFormatter={(value: number) => formatCompactNok(value)}
              tick={{ fontSize: 11, fill: '#5c7388' }}
              width={72}
            />
            <Tooltip
              formatter={(value) => formatNok(Number(value ?? 0))}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar dataKey="spend" fill="#081E32" radius={[4, 4, 0, 0]} maxBarSize={compact ? 36 : 56} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getHistorical, getDaySummary, getComponents, getSnapshot } from '../api/analytics'
import { formatCAD } from '../utils/formatters'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4']
const HIGHLIGHT = COLORS[1]
const AXIS_TICK = { fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }
const TOOLTIP_STYLE = { background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, color: '#f4f4f5' }

export default function Analytics() {
  const [selectedDayId, setSelectedDayId] = useState(null)

  const { data: historical = [] } = useQuery({
    queryKey: ['analytics', 'historical'],
    queryFn: getHistorical
  })

  const activeDayId = selectedDayId ?? historical[0]?.dayId
  const activeDayClosedAt = useMemo(
    () => historical.find(d => d.dayId === activeDayId)?.closedAt,
    [historical, activeDayId]
  )

  const { data: summary } = useQuery({
    queryKey: ['analytics', 'summary', activeDayId],
    queryFn: () => getDaySummary(activeDayId),
    enabled: !!activeDayId
  })

  const { data: components = [] } = useQuery({
    queryKey: ['analytics', 'components', activeDayId],
    queryFn: () => getComponents(activeDayId),
    enabled: !!activeDayId
  })

  const { data: snapshot } = useQuery({
    queryKey: ['analytics', 'snapshot', activeDayId],
    queryFn: () => getSnapshot(activeDayId),
    enabled: !!activeDayId && !!activeDayClosedAt
  })

  const { yearlyData, selectedYear } = useMemo(() => {
    // Step 1 — aggregate all years, capture active day's openedAt in one pass
    const { allYearsMap, activeDayOpenedAt } = historical.reduce((acc, d) => {
      const year = new Date(d.openedAt).getFullYear()
      if (!acc.allYearsMap[year]) acc.allYearsMap[year] = { revenue: 0, orders: 0 }
      acc.allYearsMap[year].revenue += d.grandTotal
      acc.allYearsMap[year].orders += d.totalOrders
      if (d.dayId === activeDayId) acc.activeDayOpenedAt = d.openedAt
      return acc
    }, { allYearsMap: {}, activeDayOpenedAt: null })
    const distinctYears = Object.keys(allYearsMap).map(Number).sort((a, b) => a - b)

    // Step 2 — derive selectedYear from active day
    const selYear = new Date(activeDayOpenedAt ?? Date.now()).getFullYear()

    // Step 3 — determine 5-year window
    if (distinctYears.length === 0) return { yearlyData: [], selectedYear: selYear }
    const minYear = distinctYears[0]
    const maxYear = distinctYears[distinctYears.length - 1]
    const yearsAfter = Math.max(0, maxYear - selYear)
    let windowYears
    if (maxYear - minYear <= 4) {
      windowYears = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i)
    } else {
      const pos = yearsAfter === 0 ? 4 : yearsAfter === 1 ? 3 : 2
      const start = selYear - pos
      windowYears = [start, start + 1, start + 2, start + 3, start + 4]
    }

    // Step 4 — fill window, zero for missing years
    const data = windowYears.map(y => ({
      year: y,
      revenue: allYearsMap[y]?.revenue ?? 0,
      orders: allYearsMap[y]?.orders ?? 0,
    }))

    return { yearlyData: data, selectedYear: selYear }
  }, [historical, activeDayId])

  return (
    <div className="h-full overflow-y-auto space-y-6">
      <h1 className="text-2xl font-black text-white tracking-wide">System Analytics</h1>

      <div className="card">
        <label className="label">Select Event Day</label>
        <select
          className="input"
          value={activeDayId ?? ''}
          onChange={e => setSelectedDayId(e.target.value || null)}
        >
          <option value="">— Select a day —</option>
          {historical.map(d => (
            <option key={d.dayId} value={d.dayId}>
              {d.label} ({formatCAD(d.grandTotal)}, {d.totalOrders} orders)
            </option>
          ))}
        </select>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card text-center">
            <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-1">Total</div>
            <div className="text-xl font-mono font-bold text-white">{formatCAD(summary.total)}</div>
            <div className="text-xs text-zinc-500 font-mono mt-1">{formatCAD(summary.subtotal)} + {formatCAD(summary.tax)} tax</div>
          </div>
          <SummaryCard label="Orders" value={summary.totalOrders} />
        </div>
      )}

      {yearlyData.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          <YearlyLineChart
            title="5-Year Revenue"
            dataKey="revenue"
            colorIndex={0}
            data={yearlyData}
            selectedYear={selectedYear}
            formatValue={v => formatCAD(v).replace('.00', '')}
          />
          <YearlyLineChart
            title="5-Year Orders"
            dataKey="orders"
            colorIndex={2}
            data={yearlyData}
            selectedYear={selectedYear}
          />
        </div>
      )}

      {summary && (
        <>
          {summary.byStream?.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="card">
                <h2 className="text-xs uppercase font-bold tracking-wider text-zinc-400 mb-4 border-b border-zinc-800/80 pb-2">Revenue by Stream</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={summary.byStream}
                      dataKey="total"
                      nameKey="stream"
                      cx="50%" cy="50%"
                      outerRadius={80}
                      label={({ stream, percent }) => `${stream} ${(percent * 100).toFixed(0)}%`}
                    >
                      {summary.byStream.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCAD(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <h2 className="text-xs uppercase font-bold tracking-wider text-zinc-400 mb-4 border-b border-zinc-800/80 pb-2">Orders by Stream</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800/80">
                      <th className="text-left pb-2 font-semibold">Stream</th>
                      <th className="text-right pb-2 font-semibold">Orders</th>
                      <th className="text-right pb-2 font-semibold">Subtotal</th>
                      <th className="text-right pb-2 font-semibold">Tax</th>
                      <th className="text-right pb-2 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.byStream.map((row, i) => (
                      <tr key={row.stream} className="border-b border-zinc-800/40 last:border-0">
                        <td className="py-2 flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="text-zinc-300 font-semibold tracking-wide">{row.stream}</span>
                        </td>
                        <td className="py-2 text-right font-mono font-bold text-white">{row.orderCount}</td>
                        <td className="py-2 text-right font-mono text-zinc-400">{formatCAD(row.subtotal)}</td>
                        <td className="py-2 text-right font-mono text-zinc-400">{formatCAD(row.tax)}</td>
                        <td className="py-2 text-right font-mono font-bold text-white">{formatCAD(row.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {summary.hourly?.length > 0 && (
            <div className="card">
              <h2 className="text-xs uppercase font-bold tracking-wider text-zinc-400 mb-4 border-b border-zinc-800/80 pb-2">Hourly Order Volume</h2>
              <HourlyHeatmap hourly={summary.hourly} />
            </div>
          )}

          {components.length > 0 && (
            <div className="card">
              <h2 className="text-xs uppercase font-bold tracking-wider text-zinc-400 mb-4 border-b border-zinc-800/80 pb-2">Ingredient Breakdown</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {components.map(row => (
                  <div key={row.component} className="flex justify-between items-center bg-zinc-900 border border-zinc-800/80 rounded-lg px-4 py-2">
                    <span className="text-zinc-300 text-xs font-semibold tracking-wide">{row.component}</span>
                    <span className="font-mono font-bold text-white text-base">{row.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {snapshot && (
            <div className="card space-y-4">
              <h2 className="text-xs uppercase font-bold tracking-wider text-zinc-400 border-b border-zinc-800/80 pb-2">System Snapshot</h2>
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <div className="bg-zinc-900 border border-zinc-800/80 rounded-lg px-4 py-2">
                  <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Tax Rate</div>
                  <div className="font-mono font-bold text-white">{(snapshot.system.taxRateBps / 100).toFixed(2)}%</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800/80 rounded-lg px-4 py-2">
                  <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Menu Items</div>
                  <div className="font-mono font-bold text-white">{snapshot.system.menu.length}</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800/80 rounded-lg px-4 py-2">
                  <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Stations</div>
                  <div className="font-mono font-bold text-white">{snapshot.system.stations.length}</div>
                </div>
              </div>

              <div>
                <div className="text-xs uppercase font-bold tracking-wider text-zinc-500 mb-2">Menu at Close</div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {snapshot.system.menu.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-zinc-900 border border-zinc-800/80 rounded-lg px-3 py-1.5">
                      <span className={`text-sm font-semibold tracking-wide ${item.active ? 'text-zinc-300' : 'text-zinc-600 line-through'}`}>{item.name}</span>
                      <span className="font-mono text-sm font-bold text-white">{formatCAD(item.priceCents)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase font-bold tracking-wider text-zinc-500 mb-2">Station Profiles at Close</div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {snapshot.system.stations.map(s => (
                    <div key={s.name} className="bg-zinc-900 border border-zinc-800/80 rounded-lg px-3 py-1.5">
                      <div className="text-sm font-semibold text-zinc-300 mb-1">{s.name}</div>
                      <div className="flex gap-1.5 flex-wrap">
                        {s.canSubmit && <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded">Submit</span>}
                        {s.canSetInProgress && <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded">In Progress</span>}
                        {s.canSetCompleted && <span className="text-[10px] bg-zinc-500/10 text-zinc-400 border border-zinc-500/30 px-1.5 py-0.5 rounded">Complete</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div className="card text-center">
      <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-1">{label}</div>
      <div className="text-xl font-mono font-bold text-white">{value}</div>
    </div>
  )
}

function YearlyLineChart({ title, dataKey, colorIndex, data, selectedYear, formatValue }) {
  const color = COLORS[colorIndex]
  return (
    <div className="card">
      <h2 className="text-xs uppercase font-bold tracking-wider text-zinc-400 mb-4 border-b border-zinc-800/80 pb-2">{title} · {selectedYear}</h2>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis dataKey="year" stroke="#71717a" tick={AXIS_TICK} />
          <YAxis stroke="#71717a" tick={AXIS_TICK} tickFormatter={formatValue} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={formatValue}
            labelFormatter={year => `Year: ${year}`}
          />
          <Line
            type="linear"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, payload } = props
              const sel = payload.year === selectedYear
              return <circle key={payload.year} cx={cx} cy={cy}
                r={sel ? 6 : 4}
                fill={sel ? HIGHLIGHT : color}
                stroke={sel ? '#fff' : 'none'}
                strokeWidth={sel ? 1.5 : 0}
              />
            }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

const HourlyHeatmap = React.memo(function HourlyHeatmap({ hourly }) {
  const maxCount = Math.max(...hourly.map(h => h.count))
  const hourMap = Object.fromEntries(hourly.map(h => [h.hour, h.count]))

  return (
    <div className="grid grid-cols-12 gap-2">
      {Array.from({ length: 24 }, (_, i) => i).map(hour => {
        const count = hourMap[hour] ?? 0
        const intensity = maxCount > 0 ? count / maxCount : 0
        return (
          <div
            key={hour}
            className="rounded-lg flex flex-col items-center justify-center py-2"
            style={{ opacity: 0.15 + intensity * 0.85, background: '#3b82f6' }}
          >
            <div className="text-white text-xs font-mono font-bold">{hour}:00</div>
            <div className="text-white text-sm font-mono font-black">{count}</div>
          </div>
        )
      })}
    </div>
  )
})

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getHistorical, getDaySummary, getComponents, compareYears } from '../api/analytics'
import { formatCAD, formatDateTime } from '../utils/formatters'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4']

export default function Analytics() {
  const [selectedDayId, setSelectedDayId] = useState(null)
  const [year1, setYear1] = useState(new Date().getFullYear())
  const [year2, setYear2] = useState(new Date().getFullYear() - 1)

  const { data: historical = [] } = useQuery({
    queryKey: ['analytics', 'historical'],
    queryFn: getHistorical
  })

  const { data: summary } = useQuery({
    queryKey: ['analytics', 'summary', selectedDayId],
    queryFn: () => getDaySummary(selectedDayId),
    enabled: !!selectedDayId
  })

  const { data: components = [] } = useQuery({
    queryKey: ['analytics', 'components', selectedDayId],
    queryFn: () => getComponents(selectedDayId),
    enabled: !!selectedDayId
  })

  const { data: comparison } = useQuery({
    queryKey: ['analytics', 'compare', year1, year2],
    queryFn: () => compareYears(year1, year2)
  })

  const activeDayId = selectedDayId ?? historical[0]?.dayId

  return (
    <div className="h-full overflow-y-auto space-y-6 max-w-6xl">
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
              {d.label} ({formatCAD(d.totalRevenue)}, {d.totalOrders} orders)
            </option>
          ))}
        </select>
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SummaryCard label="Total Revenue" value={formatCAD(summary.totalRevenue)} />
            <SummaryCard label="Total Orders" value={summary.totalOrders} />
            <SummaryCard label="Opened" value={formatDateTime(summary.openedAt)} />
            <SummaryCard label="Closed" value={summary.closedAt ? formatDateTime(summary.closedAt) : 'Still open'} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="card">
              <h2 className="text-xs uppercase font-bold tracking-wider text-zinc-400 mb-4 border-b border-zinc-800/80 pb-2">Revenue by Station</h2>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={summary.byStation}
                    dataKey="revenue"
                    nameKey="station"
                    cx="50%" cy="50%"
                    outerRadius={80}
                    label={({ station, percent }) => `${station} ${(percent * 100).toFixed(0)}%`}
                  >
                    {summary.byStation.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCAD(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h2 className="text-xs uppercase font-bold tracking-wider text-zinc-400 mb-4 border-b border-zinc-800/80 pb-2">Orders by Station</h2>
              <div className="space-y-2">
                {summary.byStation.map((row, i) => (
                  <div key={row.station} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-md" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="flex-1 text-zinc-300 text-sm font-semibold tracking-wide">{row.station}</span>
                    <span className="text-white font-mono font-bold">{row.orderCount}</span>
                    <span className="text-zinc-500 font-mono text-sm w-24 text-right">{formatCAD(row.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {summary.hourly?.length > 0 && (
            <div className="card">
              <h2 className="text-xs uppercase font-bold tracking-wider text-zinc-400 mb-4 border-b border-zinc-800/80 pb-2">Hourly Order Volume</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={summary.hourly}>
                  <XAxis
                    dataKey="hour"
                    tickFormatter={h => `${h}:00`}
                    stroke="#71717a"
                    tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }}
                  />
                  <YAxis stroke="#71717a" tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }} />
                  <Tooltip
                    labelFormatter={h => `${h}:00`}
                    contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, color: '#f4f4f5' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
        </>
      )}

      <div className="card space-y-4">
        <h2 className="text-xs uppercase font-bold tracking-wider text-zinc-400 border-b border-zinc-800/80 pb-2">Year-over-Year Comparison</h2>
        <div className="flex gap-3 flex-wrap">
          <div>
            <label className="label">Year 1</label>
            <input type="number" className="input w-28" value={year1} onChange={e => setYear1(+e.target.value)} />
          </div>
          <div>
            <label className="label">Year 2</label>
            <input type="number" className="input w-28" value={year2} onChange={e => setYear2(+e.target.value)} />
          </div>
        </div>

        {comparison && (
          <div className="grid sm:grid-cols-2 gap-4">
            {[comparison.year1, comparison.year2].map(y => (
              <div key={y.year} className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 space-y-2">
                <h3 className="text-sm tracking-widest uppercase font-black text-zinc-500">{y.year}</h3>
                <div className="text-3xl font-mono font-black text-blue-500">{formatCAD(y.totalRevenue)}</div>
                <div className="text-zinc-400 text-xs font-medium tracking-wide">{y.totalOrders} orders / {y.eventCount} event{y.eventCount !== 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
        )}
      </div>
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

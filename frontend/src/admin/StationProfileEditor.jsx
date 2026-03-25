import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getStationProfiles, createStationProfile, updateStationProfile, deleteStationProfile } from '../api/admin'

const EMPTY = {
  name: '', canSubmit: false, canSetInProgress: false, canSetCompleted: false,
  canSkipToCompleted: false, subscribeToStations: [], displayConfig: {
    showCompleted: true, completedDisplay: 'collapsed', orderGroups: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
    submitFields: [], streams: [{ label: '', stationNames: '' }]
  }, displayOrder: 0, counterEnabled: false, counterNextValue: null
}

const STATUS_LABELS = { PENDING: 'Pending', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed' }

function moveItem(arr, index, dir) {
  const next = index + dir
  if (next < 0 || next >= arr.length) return arr
  const out = [...arr]
  ;[out[index], out[next]] = [out[next], out[index]]
  return out
}

// Streams helpers: internal form uses strings, DB uses arrays/null
const streamsToForm = (streams) => {
  if (!streams || streams.length === 0) return [{ label: '', stationNames: '' }]
  return streams.map(s => ({
    label: s.label ?? '',
    stationNames: s.stationNames ? s.stationNames.join(', ') : ''
  }))
}
const streamsFromForm = (rows) =>
  rows.map(r => ({
    label: r.label.trim() || null,
    stationNames: r.stationNames.trim()
      ? r.stationNames.split(',').map(s => s.trim()).filter(Boolean)
      : null
  }))

export default function StationProfileEditor() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [subsText, setSubsText] = useState('')
  const [streamRows, setStreamRows] = useState(EMPTY.displayConfig.streams)

  const { data: profiles = [] } = useQuery({ queryKey: ['admin', 'stations'], queryFn: getStationProfiles })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'stations'] })
    setEditing(null)
  }

  const createMutation = useMutation({ mutationFn: createStationProfile, onSuccess: invalidate })
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => updateStationProfile(id, data), onSuccess: invalidate })
  const deleteMutation = useMutation({ mutationFn: deleteStationProfile, onSuccess: invalidate })

  const startEdit = (profile) => {
    setEditing(profile)
    setForm({ ...profile, counterNextValue: profile.counterNextValue ?? null })
    setSubsText(profile.subscribeToStations?.join(', ') ?? '')
    setStreamRows(streamsToForm(profile.displayConfig?.streams))
  }

  const startNew = () => {
    setEditing('new')
    setForm(EMPTY)
    setSubsText('')
    setStreamRows(EMPTY.displayConfig.streams)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...form,
      subscribeToStations: subsText.trim()
        ? subsText.split(',').map(s => s.trim()).filter(Boolean)
        : null,
      displayConfig: {
        ...form.displayConfig,
        streams: streamsFromForm(streamRows)
      },
      counterNextValue: form.counterEnabled && form.counterNextValue !== '' ? Number(form.counterNextValue) : null
    }
    if (editing === 'new') createMutation.mutate(data)
    else updateMutation.mutate({ id: editing.id, data })
  }

  const setBool = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.checked }))
  const setDisplayConfig = (field, value) => setForm(f => ({ ...f, displayConfig: { ...f.displayConfig, [field]: value } }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Station Profiles</h2>
        <button className="btn-primary text-sm" onClick={startNew}>+ New Profile</button>
      </div>

      {editing && (
        <form onSubmit={handleSubmit} className="card max-w-lg space-y-4">
          <h3 className="font-semibold text-white">{editing === 'new' ? 'New Profile' : `Edit: ${editing.name}`}</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Display Order</label>
              <input className="input" type="number" value={form.displayOrder}
                onChange={e => setForm(f => ({ ...f, displayOrder: +e.target.value }))} />
            </div>
          </div>

          <div>
            <p className="label">Permissions</p>
            <div className="space-y-2">
              {[
                ['canSubmit', 'Can Submit Orders'],
                ['canSetInProgress', 'Can Mark In Progress'],
                ['canSetCompleted', 'Can Mark Completed'],
                ['canSkipToCompleted', 'Can Skip to Completed (with confirmation)'],
              ].map(([field, label]) => (
                <label key={field} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="accent-blue-500 w-4 h-4"
                    checked={form[field] ?? false} onChange={setBool(field)} />
                  <span className="text-sm text-slate-300">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Subscribe to Stations (comma-separated, leave blank for ALL)</label>
            <input
              className="input"
              placeholder="e.g. Phone, App"
              value={subsText}
              onChange={e => setSubsText(e.target.value)}
            />
          </div>

          <div>
            <p className="label">Order Counter</p>
            <p className="text-xs text-slate-500 mb-2">Assigns an incrementing number to each order from this station, isolated from other stations</p>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input type="checkbox" className="accent-blue-500 w-4 h-4"
                checked={form.counterEnabled ?? false}
                onChange={e => setForm(f => ({ ...f, counterEnabled: e.target.checked }))} />
              <span className="text-sm text-slate-300">Enable counter for this station</span>
            </label>
            {form.counterEnabled && (
              <div>
                <label className="label">Next Number</label>
                <input
                  className="input w-32"
                  type="number" min="1"
                  placeholder="e.g. 1"
                  value={form.counterNextValue ?? ''}
                  onChange={e => setForm(f => ({ ...f, counterNextValue: e.target.value }))}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {form.counterNextValue ? `Next order will be #${form.counterNextValue}` : 'Leave blank to keep current value'}
                </p>
              </div>
            )}
          </div>

          <div>
            <p className="label">Submit Fields</p>
            <p className="text-xs text-slate-500 mb-2">Fields shown in the order details modal when submitting</p>
            <div className="space-y-2">
              {[
                ['name', 'Customer Name / Code'],
                ['app', 'App / Platform (Uber Eats, DoorDash, etc.)'],
                ['pickupTime', 'Pickup Time'],
              ].map(([value, label]) => {
                const checked = (form.displayConfig?.submitFields ?? []).includes(value)
                return (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-blue-500 w-4 h-4"
                      checked={checked}
                      onChange={e => {
                        const current = form.displayConfig?.submitFields ?? []
                        setDisplayConfig('submitFields', e.target.checked
                          ? [...current, value]
                          : current.filter(f => f !== value)
                        )
                      }} />
                    <span className="text-sm text-slate-300">{label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div>
            <p className="label">Display Config</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-blue-500 w-4 h-4"
                  checked={form.displayConfig?.showCompleted ?? true}
                  onChange={e => setDisplayConfig('showCompleted', e.target.checked)} />
                <span className="text-sm text-slate-300">Show Completed Orders</span>
              </label>
              <div>
                <label className="label">Completed Display</label>
                <select className="input" value={form.displayConfig?.completedDisplay ?? 'list'}
                  onChange={e => setDisplayConfig('completedDisplay', e.target.value)}>
                  <option value="list">List (visible)</option>
                  <option value="collapsed">Collapsed (expandable)</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <p className="label">Order Group Sequence</p>
            <p className="text-xs text-slate-500 mb-2">Drag or reorder how status groups appear on the board</p>
            <div className="space-y-1">
              {(form.displayConfig?.orderGroups ?? ['PENDING', 'IN_PROGRESS', 'COMPLETED']).map((status, i, arr) => (
                <div key={status} className="flex items-center gap-2">
                  <span className="text-sm text-slate-300 flex-1">{STATUS_LABELS[status]}</span>
                  <button type="button" className="btn-ghost text-xs py-0.5 px-2 disabled:opacity-30"
                    disabled={i === 0}
                    onClick={() => setDisplayConfig('orderGroups', moveItem(arr, i, -1))}>↑</button>
                  <button type="button" className="btn-ghost text-xs py-0.5 px-2 disabled:opacity-30"
                    disabled={i === arr.length - 1}
                    onClick={() => setDisplayConfig('orderGroups', moveItem(arr, i, 1))}>↓</button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="label">Order Streams (display columns)</p>
              <button
                type="button"
                className="btn-ghost text-xs py-0.5 px-2"
                onClick={() => setStreamRows(r => [...r, { label: '', stationNames: '' }])}
              >+ Add stream</button>
            </div>
            <div className="space-y-2">
              {streamRows.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    className="input flex-1"
                    placeholder="Label (optional, e.g. Window)"
                    value={row.label}
                    onChange={e => setStreamRows(r => r.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                  />
                  <input
                    className="input flex-1"
                    placeholder="Stations filter (blank = all, e.g. Phone, App)"
                    value={row.stationNames}
                    onChange={e => setStreamRows(r => r.map((x, j) => j === i ? { ...x, stationNames: e.target.value } : x))}
                  />
                  {streamRows.length > 1 && (
                    <button
                      type="button"
                      className="btn-danger text-xs py-1 px-2"
                      onClick={() => setStreamRows(r => r.filter((_, j) => j !== i))}
                    >×</button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1">Each stream is a column. Blank label = no column header. Blank stations = show all.</p>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>Save</button>
            <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {profiles.map(p => (
          <div key={p.id} className="card flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-white">{p.name}</div>
              <div className="flex gap-2 mt-1 flex-wrap">
                {p.canSubmit && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Submit</span>}
                {p.canSetInProgress && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">In Progress</span>}
                {p.canSetCompleted && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Complete</span>}
                {p.canSkipToCompleted && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">Skip</span>}
                {p.counterEnabled && (
                  <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">
                    Counter{p.counterNextValue != null ? ` (next: #${p.counterNextValue})` : ''}
                  </span>
                )}
                {!p.subscribeToStations && <span className="text-xs bg-slate-600 text-slate-300 px-2 py-0.5 rounded">All stations</span>}
                {p.subscribeToStations?.map(s => (
                  <span key={s} className="text-xs bg-slate-600 text-slate-300 px-2 py-0.5 rounded">{s}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost text-xs py-1" onClick={() => startEdit(p)}>Edit</button>
              <button
                className="btn-danger text-xs py-1"
                onClick={() => { if (window.confirm(`Delete profile "${p.name}"?`)) deleteMutation.mutate(p.id) }}
              >Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

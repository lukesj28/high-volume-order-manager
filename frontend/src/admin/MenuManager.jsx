import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '../api/menu'
import { formatCAD } from '../utils/formatters'

const EMPTY_FORM = { name: '', price: '', displayOrder: 0, components: [{ componentName: '', componentQuantity: 1 }] }

export default function MenuManager() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(null) // null | 'new' | item
  const [form, setForm] = useState(EMPTY_FORM)

  const { data: items = [] } = useQuery({ queryKey: ['menu', 'all'], queryFn: getAllMenuItems })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['menu'] })
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  const createMutation = useMutation({ mutationFn: createMenuItem, onSuccess: invalidate })
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => updateMenuItem(id, data), onSuccess: invalidate })
  const deleteMutation = useMutation({ mutationFn: deleteMenuItem, onSuccess: invalidate })

  const startEdit = (item) => {
    setEditing(item)
    setForm({
      name: item.name,
      price: item.price.toString(),
      displayOrder: item.displayOrder,
      components: item.components?.length
        ? item.components.map(c => ({ componentName: c.componentName, componentQuantity: c.componentQuantity }))
        : [{ componentName: '', componentQuantity: 1 }]
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      name: form.name,
      price: parseFloat(form.price),
      displayOrder: parseInt(form.displayOrder),
      components: form.components.filter(c => c.componentName.trim())
    }
    if (editing === 'new') createMutation.mutate(data)
    else updateMutation.mutate({ id: editing.id, data })
  }

  const addComponent = () => setForm(f => ({ ...f, components: [...f.components, { componentName: '', componentQuantity: 1 }] }))
  const removeComponent = (i) => setForm(f => ({ ...f, components: f.components.filter((_, j) => j !== i) }))
  const updateComponent = (i, field, value) => setForm(f => ({
    ...f, components: f.components.map((c, j) => j === i ? { ...c, [field]: value } : c)
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Menu Items</h2>
        <button className="btn-primary text-sm" onClick={() => { setEditing('new'); setForm(EMPTY_FORM) }}>
          + Add Item
        </button>
      </div>

      {(editing === 'new' || editing?.id) && (
        <form onSubmit={handleSubmit} className="card space-y-4 max-w-lg">
          <h3 className="font-semibold text-white">{editing === 'new' ? 'New Item' : `Edit: ${editing.name}`}</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Price (CAD)</label>
              <input className="input" type="number" step="0.01" min="0.01" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
            </div>
          </div>

          <div>
            <label className="label">Display Order</label>
            <input className="input w-24" type="number" value={form.displayOrder}
              onChange={e => setForm(f => ({ ...f, displayOrder: e.target.value }))} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Components (for analytics)</label>
              <button type="button" className="text-xs text-blue-400 hover:text-blue-300" onClick={addComponent}>+ Add</button>
            </div>
            {form.components.map((comp, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  className="input flex-1"
                  placeholder="Component name"
                  value={comp.componentName}
                  onChange={e => updateComponent(i, 'componentName', e.target.value)}
                />
                <input
                  className="input w-16"
                  type="number" min="1" placeholder="Qty"
                  value={comp.componentQuantity}
                  onChange={e => updateComponent(i, 'componentQuantity', parseInt(e.target.value))}
                />
                <button type="button" className="text-red-400 hover:text-red-300 px-2" onClick={() => removeComponent(i)}>✕</button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>Save</button>
            <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className={`card flex items-center justify-between gap-4 ${!item.active ? 'opacity-40' : ''}`}>
            <div>
              <div className="font-semibold text-white">
                {item.name}
                {!item.active && <span className="ml-2 text-xs text-slate-500">(inactive)</span>}
              </div>
              <div className="text-sm text-slate-400">
                {formatCAD(item.price)}
                {item.components?.length > 0 && (
                  <span className="ml-2">· {item.components.map(c => `${c.componentQuantity}× ${c.componentName}`).join(', ')}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost text-xs py-1" onClick={() => startEdit(item)}>Edit</button>
              {item.active && (
                <button
                  className="btn-danger text-xs py-1"
                  onClick={() => { if (window.confirm('Deactivate this item?')) deleteMutation.mutate(item.id) }}
                >
                  Deactivate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

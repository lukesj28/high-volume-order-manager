export const formatCAD = (amount) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount ?? 0)

export const formatTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' }) : ''

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : ''

export const formatDateTime = (iso) =>
  iso ? `${formatDate(iso)} ${formatTime(iso)}` : ''

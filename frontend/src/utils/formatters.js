export const formatCAD = (cents) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format((cents ?? 0) / 100)

export const calcTax = (subtotal, taxRateBps) => Math.round(subtotal * taxRateBps / 10000)

export const formatTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' }) : ''

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : ''

export const formatDateTime = (iso) =>
  iso ? `${formatDate(iso)} ${formatTime(iso)}` : ''

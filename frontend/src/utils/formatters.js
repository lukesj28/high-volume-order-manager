export const formatCAD = (cents) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format((cents ?? 0) / 100)

export const calcTax = (subtotal, taxRateBps) => Math.round(subtotal * taxRateBps / 10000)

export const formatTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' }) : ''

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : ''

export const formatDateTime = (iso) =>
  iso ? `${formatDate(iso)} ${formatTime(iso)}` : ''

export const timeValueToISOToday = (timeValue) => {
  const [h, m] = timeValue.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export const isoToTimeValue = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export const APP_OPTIONS = ['Uber Eats', 'DoorDash', 'SkipTheDishes', 'Ritual']

export function formatMoney(n, { minimumFractionDigits = 2 } = {}) {
  return (n || 0).toLocaleString('es-DO', { minimumFractionDigits })
}

export function formatDate(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('es-DO') } catch { return d }
}

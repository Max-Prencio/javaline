const BADGE = {
  activo: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' },
  inactivo: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' },
  pendiente: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' },
  aprobado: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' },
  rechazado: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' },
  pagada: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' },
  pagado: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' },
  publicada: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' },
  cerrada: { bg: 'rgba(107,90,74,0.1)', color: '#6b5a4a', border: '1px solid rgba(107,90,74,0.2)' },
  borrador: { bg: 'rgba(161,146,128,0.1)', color: '#a09280', border: '1px solid rgba(161,146,128,0.2)' },
  presente: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' },
  ausente: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' },
  tardanza: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' },
  vacaciones: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' },
  permiso: { bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)' },
  premium: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' },
  medio: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' },
  bajo: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' },
  no_recomendado: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' },
}

const LABELS = {
  activo: 'Activo', inactivo: 'Inactivo', pendiente: 'Pendiente', aprobado: 'Aprobado',
  rechazado: 'Rechazado', pagada: 'Pagada', pagado: 'Pagado', publicada: 'Publicada',
  cerrada: 'Cerrada', borrador: 'Borrador', presente: 'Presente', ausente: 'Ausente',
  tardanza: 'Tardanza', vacaciones: 'Vacaciones', permiso: 'Permiso', premium: 'Premium',
  medio: 'Medio', bajo: 'Bajo', no_recomendado: 'No Recomendado',
}

export default function Badge({ status }) {
  const s = (status || '').toLowerCase()
  const st = BADGE[s] || BADGE.pendiente
  return (
    <span style={{
      display: 'inline-flex', padding: '3px 10px', borderRadius: 20, fontSize: 11,
      fontWeight: 600, textTransform: 'capitalize', background: st.bg,
      color: st.color, border: st.border,
    }}>{LABELS[s] || status}</span>
  )
}

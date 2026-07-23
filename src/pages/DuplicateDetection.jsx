import { useState, useEffect, useCallback } from 'react'
import { FiCheck, FiTrash2, FiRefreshCw, FiSearch, FiUsers, FiPackage, FiMail } from 'react-icons/fi'
import api from '../services/apiClient'

const ENTITY_LABELS = { contacts: 'Contactos', inventory: 'Productos', users: 'Usuarios' }
const ENTITY_COLORS = { contacts: '#22c55e', inventory: '#f59e0b', users: '#3b82f6' }
const ICONS = { contacts: FiUsers, inventory: FiPackage, users: FiMail }

function groupBy(dups) {
  const groups = {}
  for (const d of dups) {
    const key = `${d.entity}-${d.id_a}-${d.id_b}`
    if (!groups[key]) {
      groups[key] = { entity: d.entity, id_a: d.id_a, id_b: d.id_b, matches: [], val_a: d.val_a, val_b: d.val_b }
    }
    groups[key].matches.push(d)
  }
  return Object.values(groups)
}

export default function DuplicateDetection() {
  const [duplicates, setDuplicates] = useState([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [message, setMessage] = useState('')
  const [entityFilter, setEntityFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/detect-duplicates')
      setDuplicates(res.duplicates || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleResolve = async (group, action) => {
    try {
      const res = await api.post('/admin/detect-duplicates/resolve', {
        action,
        entity: group.entity,
        primary_id: group.id_a,
        duplicate_id: group.id_b,
      })
      setMessage(res.message)
      load()
    } catch (e) {
      setMessage(e.response?.data?.detail || 'Error')
    }
  }

  const handleScanAll = async () => {
    setScanning(true)
    try {
      const res = await api.post('/admin/scan-all', {})
      setMessage(`Escaneo completado: ${res.processed || 0} registros`)
      load()
    } catch (e) {
      setMessage(e.response?.data?.detail || 'Error en escaneo')
    } finally {
      setScanning(false)
    }
  }

  const groups = groupBy(duplicates).filter(g => entityFilter === 'all' || g.entity === entityFilter)

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Detección de Duplicados</h1>
          <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>{duplicates.length} coincidencias encontradas</p>
        </div>
        <button onClick={handleScanAll} disabled={scanning}
          style={{ padding: '10px 20px', background: scanning ? '#333' : 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: scanning ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiRefreshCw size={16} className={scanning ? 'spin' : ''} /> {scanning ? 'Escaneando...' : 'Escanear todo'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'contacts', 'inventory', 'users'].map(e => {
          const IconCmp = ICONS[e]
          return (
            <button key={e} onClick={() => setEntityFilter(e)}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: entityFilter === e ? ENTITY_COLORS[e] || '#2a2a35' : '#1a1a23', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {IconCmp && <IconCmp size={14} />} {e === 'all' ? 'Todos' : ENTITY_LABELS[e]}
            </button>
          )
        })}
      </div>

      {loading && <p style={{ color: '#888', textAlign: 'center', padding: 40 }}>Cargando...</p>}

      {!loading && groups.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <FiSearch size={48} color="#333" style={{ marginBottom: 16 }} />
          <p style={{ color: '#666', fontSize: 14 }}>No se encontraron duplicados</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {groups.map((g) => {
          const best = g.matches.reduce((a, b) => a.similarity > b.similarity ? a : b)
          return (
            <div key={`${g.id_a}-${g.id_b}`} style={{ background: '#1a1a23', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: `${ENTITY_COLORS[g.entity]}22`, color: ENTITY_COLORS[g.entity] }}>
                    {ENTITY_LABELS[g.entity]}
                  </span>
                  <span style={{ fontSize: 12, color: '#888' }}>Similitud: <strong style={{ color: '#f59e0b' }}>{(best.similarity * 100).toFixed(0)}%</strong></span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handleResolve(g, 'merge')} style={{ padding: '6px 14px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, color: '#22c55e', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiCheck size={14} /> Fusionar
                  </button>
                  <button onClick={() => handleResolve(g, 'delete')} style={{ padding: '6px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiTrash2 size={14} /> Eliminar
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200, padding: 12, background: '#0f0f13', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <p style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>REGISTRO A (primario)</p>
                  {g.matches.map(m => (
                    <p key={m.field} style={{ fontSize: 12, color: '#ccc', margin: '2px 0' }}>{m.field}: <strong>{m.val_a}</strong></p>
                  ))}
                </div>
                <div style={{ flex: 1, minWidth: 200, padding: 12, background: '#0f0f13', borderRadius: 8, border: '1px solid rgba(239,68,68,0.15)' }}>
                  <p style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>REGISTRO B (duplicado)</p>
                  {g.matches.map(m => (
                    <p key={m.field} style={{ fontSize: 12, color: '#ccc', margin: '2px 0' }}>{m.field}: <strong>{m.val_b}</strong></p>
                  ))}
                </div>
              </div>
              {g.matches.length > 1 && (
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {g.matches.map(m => (
                    <span key={m.field} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                      {m.field}: {(m.similarity * 100).toFixed(0)}%
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {message && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, padding: '12px 20px', background: '#22c55e', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, zIndex: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          {message}
          <button onClick={() => setMessage('')} style={{ marginLeft: 12, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      )}
    </div>
  )
}

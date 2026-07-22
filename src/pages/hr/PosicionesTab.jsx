import logger from '../../services/logger'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FiPlus, FiBriefcase, FiEdit2, FiTrash2, FiCheck,
  FiUploadCloud, FiPaperclip,
} from 'react-icons/fi'
import api from '../../services/apiClient'
import Modal from '../../components/Modal'
import { cardStyle, inputStyle, btnPrimary, btnOutline, btnDanger, EmptyState, FormField } from './shared.jsx'

const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

/* ═══════════════════════════════════════════════════════════════
   POSICIONES TAB
   ═══════════════════════════════════════════════════════════════ */
function PosicionesTab() {
  const [positions, setPositions] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(null)
  const [newName, setNewName] = useState('')

  const load = async () => {
    try {
      const data = await api.get('/hr/positions')
      setPositions(Array.isArray(data) ? data : [])
    } catch (e) { logger.error('PosicionesTab', 'error', e) }
  }

  useEffect(() => { load() }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    try {
      if (editing) {
        const fd = new FormData()
        fd.append('name', newName.trim())
        await api.put(`/hr/positions/${editing.id}`, fd)
      } else {
        const fd = new FormData()
        fd.append('name', newName.trim())
        await api.post('/hr/positions', fd)
      }
      setModalOpen(false); setNewName(''); setEditing(null); load()
    } catch (e) { alert(e.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta posición?')) return
    try { await api.delete(`/hr/positions/${id}`); load() } catch (e) { alert(e.message) }
  }

  const handleDescrUpload = async (posId, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.post(`/hr/positions/${posId}/upload-descr`, fd)
      load()
    } catch (e) { alert(e.message) }
    finally { setUploading(false) }
  }

  const fileLabel = (fname) => {
    if (!fname) return null
    const parts = fname.split('_')
    return parts.length > 1 ? parts.slice(1).join('_') : fname
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{positions.length} posiciones registradas</p>
        <div style={{ flex: 1 }} />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => { setEditing(null); setNewName(''); setModalOpen(true) }} style={btnPrimary}>
          <FiPlus size={16} /> Nueva Posición
        </motion.button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {positions.map(p => (
          <motion.div key={p.id} layout variants={item} initial="hidden" animate="show"
            style={{ ...cardStyle, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiBriefcase size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0, flex: 1 }}>{p.name}</p>
              <button onClick={() => { setEditing(p); setNewName(p.name); setModalOpen(true) }} style={{ ...btnOutline, padding: '5px 8px', fontSize: 11 }}><FiEdit2 size={12} /></button>
              <button onClick={() => handleDelete(p.id)} style={{ ...btnDanger, padding: '5px 8px', fontSize: 11 }}><FiTrash2 size={12} /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ ...btnOutline, padding: '4px 10px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <FiUploadCloud size={11} /> {uploading ? '...' : 'Descripción'}
                <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={e => handleDescrUpload(p.id, e)} style={{ display: 'none' }} disabled={uploading} />
              </label>
              {p.description_file && (
                <a href={`/uploads/ats/${p.description_file}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <FiPaperclip size={10} />{fileLabel(p.description_file)}
                </a>
              )}
            </div>
          </motion.div>
        ))}
        {positions.length === 0 && <EmptyState icon={FiBriefcase} text="No hay posiciones registradas. Crea la primera posición." />}
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); setNewName('') }} title={editing ? 'Editar Posición' : 'Nueva Posición'} icon={FiBriefcase}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="Nombre de la Posición">
            <input value={newName} onChange={e => setNewName(e.target.value)} required style={inputStyle} placeholder="Ej: Vendedor, Desarrollador, Gerente..." />
          </FormField>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setModalOpen(false); setEditing(null); setNewName('') }} style={btnOutline}>Cancelar</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" style={btnPrimary}><FiCheck size={15} /> {editing ? 'Guardar' : 'Crear'}</motion.button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default PosicionesTab

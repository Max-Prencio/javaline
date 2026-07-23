import logger from '../../services/logger'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FiPlus, FiCheck, FiX, FiEye, FiBookmark, FiUploadCloud,
  FiPaperclip, FiFileText, FiPhone, FiRefreshCw, FiZap,
} from 'react-icons/fi'
import api from '../../services/apiClient'
import Badge from '../../components/Badge'
import Modal from '../../components/Modal'
import { cardStyle, inputStyle, btnPrimary, btnOutline, btnDanger, EmptyState, FormField } from './shared.jsx'

const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

function ATSTab() {
  const [candidates, setCandidates] = useState([])
  const [positions, setPositions] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [analyzing, setAnalyzing] = useState(null)
  const [uploading, setUploading] = useState(false)
  const emptyForm = { name: '', email: '', phone: '', position_applied: '', resume_file: '', position_descr_file: '', classification: '', notes: '' }
  const [form, setForm] = useState(emptyForm)

  const load = async () => {
    try {
      let url = '/hr/ats?'
      if (filterStatus) url += `status=${filterStatus}&`
      const data = await api.get(url)
      setCandidates(Array.isArray(data) ? data : data.items || [])
    } catch (e) { logger.error('ATSTab', 'error', e) }
  }

  const loadPositions = async () => {
    try {
      const data = await api.get('/hr/ats/positions')
      setPositions(Array.isArray(data) ? data : [])
    } catch (e) { logger.error('ATSTab', 'error', e) }
  }

  useEffect(() => { load() }, [load, filterStatus])
  useEffect(() => { loadPositions() }, [])

  const uploadFile = async (file) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post('/hr/ats/upload', fd)
      return res.filename || res.path
    } catch (e) { alert('Error al subir archivo: ' + e.message); return '' }
    finally { setUploading(false) }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      position_applied: form.position_applied,
      resume_file: form.resume_file,
      position_descr_file: form.position_descr_file,
      notes: form.notes || '',
    }
    try {
      await api.post('/hr/ats', payload)
      setModalOpen(false); setForm(emptyForm); load()
    } catch (e) { alert(e.message) }
  }

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fname = await uploadFile(file)
    if (fname) setForm({ ...form, resume_file: fname })
  }

  const handleDescrUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fname = await uploadFile(file)
    if (fname) setForm({ ...form, position_descr_file: fname })
  }

  const handleAnalyze = async (id) => {
    try {
      setAnalyzing(id)
      await api.post(`/hr/ats/${id}/analyze`)
      load()
    } catch (e) { alert(e.message) }
    finally { setAnalyzing(null) }
  }

  const handleUpdate = async (id, status) => {
    try { await api.put(`/hr/ats/${id}`, { status }); load() } catch (e) { alert(e.message) }
  }

  const classBadge = (c) => {
    const s = (c || '').toLowerCase()
    if (s === 'premium' || s === 'recomendado') return { bg: 'rgba(16,185,129,0.12)', color: '#10b981', label: c || 'Premium' }
    if (s === 'calificado') return { bg: 'rgba(16,185,129,0.12)', color: '#10b981', label: 'Calificado' }
    if (s === 'medianamente-calificado' || s === 'medio' || s === 'apto') return { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: c || 'Medio' }
    if (s === 'subcalificado') return { bg: 'rgba(239,68,68,0.12)', color: '#f59e0b', label: 'Subcalificado' }
    if (s === 'no-calificado') return { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', label: 'No Calificado' }
    return { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', label: c || 'No Recomendado' }
  }

  const fileLabel = (fname) => {
    if (!fname) return null
    const parts = fname.split('_')
    return parts.length > 1 ? parts.slice(1).join('_') : fname
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 140 }}>
          <option value="">Todos</option>
          <option value="nuevo">Nuevo</option>
          <option value="en_revision">En Revisión</option>
          <option value="entrevista">Entrevista</option>
          <option value="contratado">Contratado</option>
          <option value="rechazado">Rechazado</option>
        </select>
        <div style={{ flex: 1 }} />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => { setForm(emptyForm); setModalOpen(true) }} style={btnPrimary}>
          <FiPlus size={16} /> Nuevo Candidato
        </motion.button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {candidates.map(c => (
          <motion.div key={c.id} layout variants={item} initial="hidden" animate="show"
            style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>
              {(c.name || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{c.name}</p>
                {c.classification && (() => {
                  const cls = classBadge(c.classification)
                  return <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700, background: cls.bg, color: cls.color, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{cls.label}</span>
                })()}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{c.position_applied || '—'} · {c.email || '—'}</p>
              {(c.resume_file || c.position_descr_file) && (
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  {c.resume_file && (
                    <a href={`/hr/files/${c.resume_file}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <FiPaperclip size={10} />{fileLabel(c.resume_file)}
                    </a>
                  )}
                  {c.position_descr_file && (
                    <a href={`/hr/files/${c.position_descr_file}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <FiFileText size={10} />{fileLabel(c.position_descr_file)}
                    </a>
                  )}
                </div>
              )}
              {c.phone && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0 0' }}><FiPhone size={10} style={{ marginRight: 4 }} />{c.phone}</p>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <Badge status={c.status || 'nuevo'} />
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => handleAnalyze(c.id)}
                disabled={analyzing === c.id}
                style={{ ...btnOutline, padding: '7px 14px', borderColor: 'rgba(139,92,246,0.3)', color: analyzing === c.id ? 'var(--text-muted)' : '#8b5cf6', opacity: analyzing === c.id ? 0.6 : 1 }}>
                {analyzing === c.id ? <FiRefreshCw size={13} className="animate-spin" /> : <FiZap size={13} />}
                {analyzing === c.id ? 'Analizando...' : 'Analizar con IA'}
              </motion.button>
              <div style={{ display: 'flex', gap: 4 }}>
                {c.status !== 'contratado' && (
                  <button onClick={() => handleUpdate(c.id, 'entrevista')} style={{ ...btnOutline, padding: '5px 10px', fontSize: 11 }}><FiEye size={12} /></button>
                )}
                {c.status === 'entrevista' && (
                  <button onClick={() => handleUpdate(c.id, 'contratado')} style={{ ...btnOutline, padding: '5px 10px', color: 'var(--success)', borderColor: 'rgba(16,185,129,0.3)' }}><FiCheck size={12} /></button>
                )}
                {c.status !== 'rechazado' && c.status !== 'contratado' && (
                  <button onClick={() => handleUpdate(c.id, 'rechazado')} style={{ ...btnDanger, padding: '5px 10px' }}><FiX size={12} /></button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {candidates.length === 0 && <EmptyState icon={FiBookmark} text="No hay candidatos en el ATS" />}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo Candidato" icon={FiBookmark} wide>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Nombre Completo"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={inputStyle} /></FormField>
            <FormField label="Email"><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} /></FormField>
            <FormField label="Teléfono"><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} /></FormField>
            <FormField label="Posición Aplicada">
              <select value={form.position_applied} onChange={e => setForm({ ...form, position_applied: e.target.value })} required style={inputStyle}>
                <option value="">Seleccionar posición...</option>
                {positions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="CV / Resumen (PDF, Word, Imagen)">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ ...btnOutline, padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiUploadCloud size={14} /> {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
                <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp" onChange={handleResumeUpload} style={{ display: 'none' }} disabled={uploading} />
              </label>
              {form.resume_file && <span style={{ fontSize: 12, color: 'var(--accent)' }}><FiPaperclip size={11} /> {fileLabel(form.resume_file)}</span>}
            </div>
          </FormField>
          <FormField label="Descripción del Puesto (PDF, Word, Imagen)">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ ...btnOutline, padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiUploadCloud size={14} /> {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
                <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp" onChange={handleDescrUpload} style={{ display: 'none' }} disabled={uploading} />
              </label>
              {form.position_descr_file && <span style={{ fontSize: 12, color: 'var(--accent)' }}><FiFileText size={11} /> {fileLabel(form.position_descr_file)}</span>}
            </div>
          </FormField>
          <FormField label="Notas"><textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Notas adicionales..." /></FormField>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setModalOpen(false)} style={btnOutline}>Cancelar</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" style={btnPrimary} disabled={uploading}><FiCheck size={15} /> Crear Candidato</motion.button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default ATSTab

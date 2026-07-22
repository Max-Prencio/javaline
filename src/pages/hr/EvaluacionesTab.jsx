import logger from '../../services/logger'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiPlus, FiCheck, FiAward } from 'react-icons/fi'
import api from '../../services/apiClient'
import DatePicker from '../../components/DatePicker'
import Badge from '../../components/Badge'
import Modal from '../../components/Modal'
import { cardStyle, inputStyle, btnPrimary, btnOutline, EmptyState, FormField, item } from './shared.jsx'
import { formatDate } from '../../utils/format'

/* ═══════════════════════════════════════════════════════════════
   EVALUACIONES TAB
   ═══════════════════════════════════════════════════════════════ */
function EvaluacionesTab({ employees }) {
  const [evaluations, setEvaluations] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const emptyForm = {
    employee_id: '', evaluator: '', evaluation_date: '', score: '',
    strengths: '', weaknesses: '', recommendations: '', status: 'pendiente',
    criteria_scores: '',
  }
  const [form, setForm] = useState(emptyForm)

  const load = async () => {
    try {
      let url = '/hr/evaluations?'
      if (filterStatus) url += `status=${filterStatus}&`
      const data = await api.get(url)
      setEvaluations(Array.isArray(data) ? data : data.items || [])
    } catch (e) { logger.error('EvaluacionesTab', 'error', e) }
  }

  useEffect(() => { load() }, [load, filterStatus])

  const handleSave = async (e) => {
    e.preventDefault()
    let criteria = null
    if (form.criteria_scores) {
      try { criteria = JSON.parse(form.criteria_scores) } catch { criteria = form.criteria_scores }
    }
    const payload = {
      ...form, score: Number(form.score) || 0, criteria_scores: criteria,
    }
    try {
      await api.post('/hr/evaluations', payload)
      setModalOpen(false); setForm(emptyForm); load()
    } catch (e) { alert(e.message) }
  }

  const handleUpdate = async (id, status) => {
    try { await api.put(`/hr/evaluations/${id}`, { status }); load() } catch (e) { alert(e.message) }
  }

  const scoreColor = (s) => {
    if (s >= 80) return 'var(--success)'
    if (s >= 60) return 'var(--warning)'
    return 'var(--danger)'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 140 }}>
          <option value="">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="completada">Completada</option>
        </select>
        <div style={{ flex: 1 }} />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => { setForm(emptyForm); setModalOpen(true) }} style={btnPrimary}>
          <FiPlus size={16} /> Nueva Evaluación
        </motion.button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {evaluations.map(ev => (
          <motion.div key={ev.id} layout variants={item} initial="hidden" animate="show"
            style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: scoreColor(ev.score), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{ev.score || '—'}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {employees.find(e => e.id === ev.employee_id)?.name || ev.employee_name || ev.employee_id}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Evaluador: {ev.evaluator || '—'} · {formatDate(ev.evaluation_date)}
              </p>
              {ev.strengths && <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Fortalezas: {ev.strengths}</p>}
              {ev.weaknesses && <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Debilidades: {ev.weaknesses}</p>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
              <Badge status={ev.status || 'pendiente'} />
              {ev.status === 'pendiente' && (
                <button onClick={() => handleUpdate(ev.id, 'completada')} style={{ ...btnOutline, padding: '5px 10px', fontSize: 11 }}>
                  <FiCheck size={12} /> Completar
                </button>
              )}
            </div>
          </motion.div>
        ))}
        {evaluations.length === 0 && <EmptyState icon={FiAward} text="No hay evaluaciones registradas" />}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Evaluación" icon={FiAward} wide>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Empleado">
              <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} required style={inputStyle}>
                <option value="">Seleccionar...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </FormField>
            <FormField label="Evaluador"><input value={form.evaluator} onChange={e => setForm({ ...form, evaluator: e.target.value })} style={inputStyle} placeholder="Nombre del evaluador" /></FormField>
            <DatePicker label="Fecha" value={form.evaluation_date} onChange={v => setForm({ ...form, evaluation_date: v })} />
            <FormField label="Puntuación (0-100)"><input type="number" min="0" max="100" value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} style={inputStyle} /></FormField>
          </div>
          <FormField label="Fortalezas"><textarea value={form.strengths} onChange={e => setForm({ ...form, strengths: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Puntos fuertes del empleado..." /></FormField>
          <FormField label="Debilidades"><textarea value={form.weaknesses} onChange={e => setForm({ ...form, weaknesses: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Áreas de mejora..." /></FormField>
          <FormField label="Recomendaciones"><textarea value={form.recommendations} onChange={e => setForm({ ...form, recommendations: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Acciones recomendadas..." /></FormField>
          <FormField label="Criterios (JSON)"><textarea value={form.criteria_scores} onChange={e => setForm({ ...form, criteria_scores: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} placeholder='{"liderazgo": 85, "puntualidad": 90, "productividad": 75}' /></FormField>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setModalOpen(false)} style={btnOutline}>Cancelar</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" style={btnPrimary}><FiCheck size={15} /> Crear Evaluación</motion.button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default EvaluacionesTab

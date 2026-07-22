import logger from '../../services/logger'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiPlus, FiX, FiSend, FiStopCircle, FiMessageSquare, FiCheck, FiList } from 'react-icons/fi'
import api from '../../services/apiClient'
import Badge from '../../components/Badge'
import Modal from '../../components/Modal'
import { cardStyle, inputStyle, labelStyle, btnPrimary, btnOutline, btnDanger, EmptyState, FormField } from './shared.jsx'
import { formatDate } from '../../utils/format'

const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

/* ═══════════════════════════════════════════════════════════════
   ENCUESTAS TAB
   ═══════════════════════════════════════════════════════════════ */
function EncuestasTab() {
  const [surveys, setSurveys] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [respondModal, setRespondModal] = useState(null)
  const [questions, setQuestions] = useState([{ text: '', type: 'text', options: '' }])
  const [responseAnswers, setResponseAnswers] = useState({})
  const emptyForm = { title: '', description: '', status: 'borrador' }
  const [form, setForm] = useState(emptyForm)

  const load = async () => {
    try {
      const data = await api.get('/hr/surveys')
      setSurveys(Array.isArray(data) ? data : data.items || [])
    } catch (e) { logger.error('EncuestasTab', 'error', e) }
  }

  useEffect(() => { load() }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    const processedQs = questions.map(q => ({
      text: q.text, type: q.type,
      options: q.options ? q.options.split(',').map(o => o.trim()).filter(Boolean) : [],
    }))
    try {
      await api.post('/hr/surveys', { ...form, questions: processedQs })
      setModalOpen(false); setForm(emptyForm); setQuestions([{ text: '', type: 'text', options: '' }]); load()
    } catch (e) { alert(e.message) }
  }

  const handleStatus = async (id, status) => {
    try { await api.put(`/hr/surveys/${id}`, { status }); load() } catch (e) { alert(e.message) }
  }

  const handleRespond = async () => {
    if (!respondModal) return
    try {
      await api.post(`/hr/surveys/${respondModal.id}/respond`, { answers: responseAnswers })
      setRespondModal(null); setResponseAnswers({})
    } catch (e) { alert(e.message) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1 }} />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => { setForm(emptyForm); setQuestions([{ text: '', type: 'text', options: '' }]); setModalOpen(true) }} style={btnPrimary}>
          <FiPlus size={16} /> Nueva Encuesta
        </motion.button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {surveys.map(s => (
          <motion.div key={s.id} layout variants={item} initial="hidden" animate="show"
            style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{s.title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{formatDate(s.created_at || s.createdAt)}</p>
              </div>
              <Badge status={s.status || 'borrador'} />
            </div>
            {s.description && <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{s.description}</p>}
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              <FiList size={11} style={{ marginRight: 4 }} />{Array.isArray(s.questions) ? s.questions.length : 0} preguntas
            </p>
            <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border-light)' }}>
              {s.status === 'borrador' && (
                <button onClick={() => handleStatus(s.id, 'publicada')} style={{ ...btnOutline, flex: 1, color: 'var(--success)', borderColor: 'rgba(16,185,129,0.3)' }}>
                  <FiSend size={12} /> Publicar
                </button>
              )}
              {s.status === 'publicada' && (
                <button onClick={() => handleStatus(s.id, 'cerrada')} style={{ ...btnOutline, flex: 1, color: 'var(--warning)', borderColor: 'rgba(245,158,11,0.3)' }}>
                  <FiStopCircle size={12} /> Cerrar
                </button>
              )}
              {s.status === 'publicada' && (
                <button onClick={() => { setRespondModal(s); setResponseAnswers({}) }} style={{ ...btnOutline, flex: 1 }}>
                  <FiMessageSquare size={12} /> Responder
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      {surveys.length === 0 && <EmptyState icon={FiMessageSquare} text="No hay encuestas creadas" />}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Encuesta" icon={FiMessageSquare} wide>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="Título"><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required style={inputStyle} placeholder="Encuesta de satisfacción..." /></FormField>
          <FormField label="Descripción"><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} /></FormField>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Preguntas</label>
              <button type="button" onClick={() => setQuestions([...questions, { text: '', type: 'text', options: '' }])}
                style={{ ...btnOutline, padding: '4px 10px', fontSize: 11 }}><FiPlus size={11} /> Agregar</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {questions.map((q, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', minWidth: 20 }}>#{i + 1}</span>
                    <input value={q.text} onChange={e => { const nq = [...questions]; nq[i].text = e.target.value; setQuestions(nq) }}
                      placeholder="Escribe la pregunta..." style={{ ...inputStyle, flex: 1 }} />
                    <select value={q.type} onChange={e => { const nq = [...questions]; nq[i].type = e.target.value; setQuestions(nq) }}
                      style={{ ...inputStyle, width: 'auto', padding: '8px 10px', fontSize: 12 }}>
                      <option value="text">Texto</option>
                      <option value="rating">Calificación</option>
                      <option value="yes_no">Sí/No</option>
                      <option value="multiple">Múltiple</option>
                    </select>
                    {questions.length > 1 && (
                      <button type="button" onClick={() => setQuestions(questions.filter((_, j) => j !== i))}
                        style={{ ...btnDanger, padding: '5px 8px' }}><FiX size={12} /></button>
                    )}
                  </div>
                  {q.type === 'multiple' && (
                    <input value={q.options} onChange={e => { const nq = [...questions]; nq[i].options = e.target.value; setQuestions(nq) }}
                      placeholder="Opciones separadas por coma..." style={{ ...inputStyle, fontSize: 12 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setModalOpen(false)} style={btnOutline}>Cancelar</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" style={btnPrimary}><FiCheck size={15} /> Crear Encuesta</motion.button>
          </div>
        </form>
      </Modal>

      <Modal open={!!respondModal} onClose={() => setRespondModal(null)} title={`Responder: ${respondModal?.title || ''}`} icon={FiMessageSquare}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {Array.isArray(respondModal?.questions) && respondModal.questions.map((q, i) => (
            <div key={i}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>{i + 1}. {q.text}</p>
              {q.type === 'text' && (
                <textarea value={responseAnswers[i] || ''} onChange={e => setResponseAnswers({ ...responseAnswers, [i]: e.target.value })}
                  rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Tu respuesta..." />
              )}
              {q.type === 'rating' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" onClick={() => setResponseAnswers({ ...responseAnswers, [i]: n })}
                      style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${responseAnswers[i] === n ? 'var(--accent)' : 'var(--border)'}`, background: responseAnswers[i] === n ? 'var(--accent-subtle)' : 'var(--bg-card)', color: responseAnswers[i] === n ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {n}
                    </button>
                  ))}
                </div>
              )}
              {q.type === 'yes_no' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {['Sí', 'No'].map(a => (
                    <button key={a} type="button" onClick={() => setResponseAnswers({ ...responseAnswers, [i]: a })}
                      style={{ ...btnOutline, borderColor: responseAnswers[i] === a ? 'var(--accent)' : 'var(--border)', color: responseAnswers[i] === a ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {a}
                    </button>
                  ))}
                </div>
              )}
              {q.type === 'multiple' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(q.options || []).map(opt => (
                    <button key={opt} type="button" onClick={() => setResponseAnswers({ ...responseAnswers, [i]: opt })}
                      style={{ ...btnOutline, justifyContent: 'flex-start', borderColor: responseAnswers[i] === opt ? 'var(--accent)' : 'var(--border)', color: responseAnswers[i] === opt ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setRespondModal(null)} style={btnOutline}>Cancelar</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleRespond} style={btnPrimary}><FiSend size={14} /> Enviar Respuesta</motion.button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default EncuestasTab

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiEdit2, FiTrash2, FiBook, FiSettings, FiPackage, FiInfo } from 'react-icons/fi'
import api from '../services/apiClient'

const CATEGORIES = ['general', 'productos', 'proveedores', 'procesos', 'reglas']
const CAT_ICONS = { general: FiInfo, productos: FiPackage, proveedores: FiSettings, procesos: FiSettings, reglas: FiBook }

export default function AiContext() {
  const [entries, setEntries] = useState([])
  const [modal, setModal] = useState(null)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ title: '', content: '', category: 'general' })

  const load = async () => {
    try {
      const res = await api.get('/ai/context')
      setEntries(res)
    } catch {}
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditId(null)
    setForm({ title: '', content: '', category: 'general' })
    setModal(true)
  }

  const openEdit = (e) => {
    setEditId(e.id)
    setForm({ title: e.title, content: e.content, category: e.category })
    setModal(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.content) return
    if (editId) {
      await api.put(`/ai/context/${editId}`, form)
    } else {
      await api.post('/ai/context', form)
    }
    setModal(false)
    load()
  }

  const handleDelete = async (id) => {
    await api.delete(`/ai/context/${id}`)
    load()
  }

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Contexto del Negocio</h1>
          <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>
            {entries.length} entradas — esta información se le inyecta al asistente IA para que conozca tu negocio
          </p>
        </div>
        <button onClick={openCreate} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiPlus size={16} /> Agregar contexto
        </button>
      </div>

      {entries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <FiBook size={48} color="#333" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#ccc' }}>Sin contexto aún</h2>
          <p style={{ color: '#888', fontSize: 13, maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
            Agrega información sobre tu negocio: qué vendes, tus procesos, reglas internas, proveedores, etc.
            El asistente IA usará esto para darte respuestas más precisas.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400, margin: '20px auto 0' }}>
            {[
              'Vendemos muebles de oficina importados de China. Nuestros clientes principales son empresas.',
              'Nuestro almacén principal está en Santo Domingo. Usamos los estantes A1-A10 para sillas.',
              'Los productos con stock menor a 5 unidades deben reordenarse automáticamente.',
            ].map(ex => (
              <button key={ex} onClick={() => { setForm({ title: 'Ejemplo', content: ex, category: 'general' }); setModal(true) }}
                style={{ padding: '10px 14px', background: '#1a1a23', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, color: '#aaa', fontSize: 12, cursor: 'pointer', textAlign: 'left' }}>
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {entries.map(e => {
          const Icon = CAT_ICONS[e.category] || FiInfo
          return (
            <motion.div key={e.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: '#1a1a23', borderRadius: 12, padding: '16px 20px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color="#f59e0b" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#fff' }}>{e.title}</h3>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', textTransform: 'capitalize' }}>{e.category}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#aaa', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{e.content}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button onClick={() => openEdit(e)} style={{ padding: 6, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, color: '#888', cursor: 'pointer' }}>
                    <FiEdit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(e.id)} style={{ padding: 6, background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, color: '#ef4444', cursor: 'pointer' }}>
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#1a1a23', borderRadius: 16, padding: 28, width: '90%', maxWidth: 520, border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px' }}>{editId ? 'Editar' : 'Agregar'} contexto</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Categoría</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: '#0f0f13', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Título</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="Ej: Tipo de productos que vendemos"
                    style={{ width: '100%', padding: '10px 14px', background: '#0f0f13', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Contenido</label>
                  <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                    placeholder="Describe en detalle..."
                    rows={5}
                    style={{ width: '100%', padding: '10px 14px', background: '#0f0f13', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
                <button onClick={handleSave} disabled={!form.title || !form.content}
                  style={{ padding: '12px', background: form.title && form.content ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#333', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: form.title && form.content ? 'pointer' : 'not-allowed', marginTop: 4 }}>
                  {editId ? 'Guardar Cambios' : 'Agregar Contexto'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

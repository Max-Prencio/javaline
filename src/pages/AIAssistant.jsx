import { useState, useRef, useEffect } from 'react'
import { FiSend, FiTrash2, FiMessageSquare, FiZap, FiClock, FiDatabase, FiAlertTriangle, FiPackage, FiAlertCircle, FiBook } from 'react-icons/fi'
import api from '../services/apiClient'

export default function AIAssistant() {
  const [conversations, setConversations] = useState([])
  const [currentId, setCurrentId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [lastSql, setLastSql] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [contextCount, setContextCount] = useState(0)
  const [aiConfigured, setAiConfigured] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { loadConversations(); loadMeta() }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const loadConversations = async () => {
    try {
      const res = await api.get('/ai/conversations')
      setConversations(res)
    } catch {}
  }

  const loadMeta = async () => {
    try {
      const [cfg, ctx, alertData] = await Promise.all([
        api.get('/ai/config'),
        api.get('/ai/context').catch(() => []),
        api.get('/ai/alerts').catch(() => []),
      ])
      setAiConfigured(cfg.configured)
      setContextCount(Array.isArray(ctx) ? ctx.length : 0)
      setAlerts(alertData || [])
    } catch {}
  }

  const loadConversation = async (id) => {
    try {
      const res = await api.get(`/ai/conversations/${id}`)
      setCurrentId(id)
      setMessages(res.messages || [])
      setLastSql(null)
    } catch {}
  }

  const newConversation = () => {
    setCurrentId(null)
    setMessages([])
    setLastSql(null)
  }

  const handleSend = async () => {
    const msg = input.trim()
    if (!msg || loading) return
    setInput('')
    setLoading(true)
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    try {
      const res = await api.post('/ai/chat', {
        message: msg,
        conversation_id: currentId,
      })
      setCurrentId(res.conversation_id)
      setMessages(prev => [...prev, { role: 'assistant', content: res.response }])
      if (res.sql) setLastSql(res.sql)
      if (res.alerts && res.alerts.length > 0) setAlerts(res.alerts)
      loadConversations()
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error al conectar con el asistente. Verifica la configuración de OpenAI.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/ai/conversations/${id}`)
      if (currentId === id) newConversation()
      loadConversations()
    } catch {}
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', background: '#0f0f13', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
      {showSidebar && (
        <div style={{ width: 280, background: '#1a1a23', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={newConversation} style={{ width: '100%', padding: '10px 16px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <FiZap size={16} /> Nueva conversación
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
            {conversations.map(c => (
              <div key={c.id} onClick={() => loadConversation(c.id)}
                style={{ padding: '12px 20px', cursor: 'pointer', background: currentId === c.id ? 'rgba(245,158,11,0.08)' : 'transparent', borderLeft: currentId === c.id ? '3px solid #f59e0b' : '3px solid transparent', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: '#ccc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</p>
                  <p style={{ fontSize: 11, color: '#555', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiMessageSquare size={10} /> {c.message_count} mensajes
                  </p>
                </div>
                <button onClick={e => { e.stopPropagation(); handleDelete(c.id) }} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 4, opacity: 0, transition: 'opacity 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                  <FiTrash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1a1a23' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setShowSidebar(!showSidebar)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 18 }}>☰</button>
            <FiZap size={18} color="#f59e0b" />
            <h1 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Asistente IA</h1>
            {contextCount > 0 && (
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                <FiBook size={10} /> {contextCount} ctx
              </span>
            )}
            {!aiConfigured && (
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                Sin API key
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {lastSql && (
              <div style={{ fontSize: 11, color: '#555', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiDatabase size={12} /> SQL ejecutado
              </div>
            )}
          </div>
        </div>

        {alerts.length > 0 && (
          <div style={{ padding: '8px 20px', background: 'rgba(245,158,11,0.08)', borderBottom: '1px solid rgba(245,158,11,0.15)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {alerts.map((a, i) => (
              <span key={i} style={{ fontSize: 11, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                <FiAlertTriangle size={12} /> {a.title}: {a.items?.length} {a.items?.length === 1 ? 'producto' : 'productos'}
              </span>
            ))}
            <button onClick={() => setAlerts([])} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 12 }}>×</button>
          </div>
        )}

        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: 500, margin: '0 auto' }}>
              <FiZap size={48} color="#333" style={{ marginBottom: 16 }} />
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Asistente de Negocios</h2>
              <p style={{ color: '#888', fontSize: 13, lineHeight: 1.6 }}>
                Pregúntame sobre tu negocio en lenguaje natural. Ejemplos:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                {[
                  '¿Cuántos productos tengo en inventario?',
                  '¿Cuáles son los clientes más recientes?',
                  '¿Cuántas ventas se han registrado?',
                  '¿Qué productos tienen bajo stock?',
                  'Resumen de facturas del mes',
                ].map(ex => (
                  <button key={ex} onClick={() => setInput(ex)}
                    style={{ padding: '10px 16px', background: '#1a1a23', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, color: '#aaa', fontSize: 12, cursor: 'pointer', textAlign: 'left' }}>
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
              <div style={{ maxWidth: '75%', padding: '12px 18px', borderRadius: 14, background: m.role === 'user' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#1a1a23', border: m.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.06)', whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.6 }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
              <div style={{ padding: '12px 18px', borderRadius: 14, background: '#1a1a23', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1s infinite' }} />
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1s infinite 0.2s' }} />
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1s infinite 0.4s' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#1a1a23' }}>
          <div style={{ display: 'flex', gap: 10, maxWidth: 800, margin: '0 auto' }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Escribe tu pregunta sobre el negocio..."
              style={{ flex: 1, padding: '12px 18px', background: '#0f0f13', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 13, outline: 'none' }} />
            <button onClick={handleSend} disabled={!input.trim() || loading}
              style={{ padding: '12px 20px', background: input.trim() && !loading ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#333', border: 'none', borderRadius: 12, color: '#fff', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiSend size={16} /> Enviar
            </button>
          </div>
          {lastSql && (
            <div style={{ maxWidth: 800, margin: '8px auto 0', padding: '8px 12px', background: '#0f0f13', borderRadius: 8, fontSize: 11, color: '#555', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <FiDatabase size={10} style={{ marginRight: 6 }} />{lastSql}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 0.3 } 50% { opacity: 1 } }
      `}</style>
    </div>
  )
}

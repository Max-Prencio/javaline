import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCamera, FiCheck, FiX, FiPackage, FiSearch, FiPlus, FiMinus, FiTrash2, FiArrowLeft, FiAlertTriangle } from 'react-icons/fi'
import pocketService from '../services/pocketService'
import { BrowserMultiFormatReader } from '@zxing/library'

export default function InventoryCount() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [scannedList, setScannedList] = useState([])
  const [scanning, setScanning] = useState(false)
  const [manualSku, setManualSku] = useState('')
  const [manualQty, setManualQty] = useState(1)
  const [showScanner, setShowScanner] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [tab, setTab] = useState('scan')
  const scannerRef = useRef(null)
  const videoRef = useRef(null)

  const startSession = async () => {
    const s = await pocketService.startCountSession()
    setSession(s)
    setScannedList([])
    setError('')
  }

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      try { scannerRef.current.reset() } catch {}
      scannerRef.current = null
    }
    setShowScanner(false)
    setScanning(false)
  }, [])

  const addScanned = async (sku, qty = 1, location = {}) => {
    if (!session) return startSession()
    try {
      const result = await pocketService.scanProduct(session.id, sku, location)
      setScannedList(prev => {
        const exists = prev.findIndex(s => s.sku === sku)
        if (exists >= 0) {
          const updated = [...prev]
          updated[exists] = result
          return updated
        }
        return [...prev, result]
      })
      setManualSku('')
      setError('')
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al registrar producto')
    }
  }

  const handleFinish = async (action) => {
    if (!session) return
    try {
      const result = await pocketService.finishCountSession(session.id, action)
      setSession(null)
      setShowScanner(false)
      setScanning(false)
      setError(result.message || 'Inventario confirmado')
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al finalizar')
    }
  }

  const openScanner = () => {
    setShowScanner(true)
    setScanning(true)
    setTimeout(async () => {
      try {
        const reader = new BrowserMultiFormatReader()
        scannerRef.current = reader
        const result = await reader.decodeOnceFromVideoDevice(null, 'scanner-video')
        if (result?.getText()) {
          await addScanned(result.getText())
        }
        stopScanner()
      } catch (err) {
        if (err.message?.includes('NotFoundException')) {
          setError('No se detectó código. Intente manual.')
        } else {
          setError('Error de cámara: ' + err.message)
        }
        stopScanner()
      }
    }, 500)
  }

  const loadHistory = async () => {
    const h = await pocketService.getCountHistory()
    setHistory(h)
  }

  useEffect(() => {
    if (tab === 'history') loadHistory()
  }, [tab])

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f13', color: '#fff', fontFamily: "'Inter', sans-serif", maxWidth: 480, margin: '0 auto' }}>
      <div style={{ padding: '16px 20px', background: '#1a1a23', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate('/pocket')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 4 }}>
          <FiArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Inventario</h1>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {['scan', 'manual', 'history'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: '12px', background: 'none', border: 'none', color: tab === t ? '#f59e0b' : '#666', cursor: 'pointer', fontSize: 12, fontWeight: 600, borderBottom: tab === t ? '2px solid #f59e0b' : '2px solid transparent', textTransform: 'uppercase' }}>
            {t === 'scan' ? 'Escanear' : t === 'manual' ? 'Manual' : 'Historial'}
          </button>
        ))}
      </div>

      <div style={{ padding: 20 }}>
        {!session && tab !== 'history' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '40px 20px' }}>
            <FiPackage size={48} color="#333" style={{ marginBottom: 16 }} />
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Nuevo Conteo</h2>
            <p style={{ color: '#666', fontSize: 13, marginBottom: 24 }}>Inicie una sesión de inventario para comenzar a escanear productos.</p>
            <button onClick={startSession} style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
              Iniciar Conteo
            </button>
          </motion.div>
        )}

        {session && tab === 'scan' && (
          <>
            <div style={{ background: '#1a1a23', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>SESIÓN ACTIVA</p>
              <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>#{session.id?.toString().slice(-6)}</p>
              <p style={{ fontSize: 12, color: '#666', margin: 0 }}>Iniciado {new Date(session.started_at).toLocaleString('es-DO')}</p>
            </div>

            <button onClick={openScanner} disabled={scanning}
              style={{ width: '100%', padding: '60px 20px', background: '#1a1a23', border: '2px dashed rgba(245,158,11,0.3)', borderRadius: 16, color: '#f59e0b', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <FiCamera size={36} />
              <span style={{ fontSize: 14 }}>{scanning ? 'Escaneando...' : 'Tocar para escanear'}</span>
            </button>

            {showScanner && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <video id="scanner-video" ref={videoRef} style={{ width: '100%', maxWidth: 400, borderRadius: 12 }} playsInline muted />
                <p style={{ color: '#888', fontSize: 12, marginTop: 12 }}>Enfocando cámara...</p>
                <button onClick={stopScanner} style={{ position: 'absolute', top: 40, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiX size={20} />
                </button>
              </motion.div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {scannedList.map((item, i) => (
                <motion.div key={item.sku} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  style={{ background: '#1a1a23', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: '#fff' }}>{item.product_name || item.sku}</p>
                    <p style={{ fontSize: 11, color: '#666', margin: '2px 0 0' }}>SKU: {item.sku}</p>
                    {item.shelf && <p style={{ fontSize: 10, color: '#555', margin: '2px 0 0' }}>{item.shelf} / {item.row} / {item.box}</p>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 18, fontWeight: 700, margin: 0, color: f => f >= 0 ? '#22c55e' : '#ef4444' }}>{item.actual_qty}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {scannedList.length > 0 && (
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => handleFinish('confirm')}
                  style={{ flex: 1, padding: '14px', background: '#22c55e', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  <FiCheck size={18} style={{ marginRight: 6 }} /> Confirmar
                </button>
                <button onClick={() => handleFinish('discard')}
                  style={{ flex: 1, padding: '14px', background: '#ef4444', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  <FiX size={18} style={{ marginRight: 6 }} /> Descartar
                </button>
              </div>
            )}
          </>
        )}

        {session && tab === 'manual' && (
          <div style={{ paddingTop: 20 }}>
            <div style={{ background: '#1a1a23', borderRadius: 12, padding: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
              <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Código SKU</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input value={manualSku} onChange={e => setManualSku(e.target.value)}
                  placeholder="Ej: PROD-001"
                  style={{ flex: 1, padding: '12px 14px', background: '#0f0f13', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none' }} />
                <button onClick={openScanner} style={{ padding: '12px', background: '#0f0f13', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f59e0b', cursor: 'pointer' }}>
                  <FiCamera size={20} />
                </button>
              </div>

              <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Cantidad</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button onClick={() => setManualQty(Math.max(1, manualQty - 1))} style={{ padding: '12px', background: '#0f0f13', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', cursor: 'pointer' }}><FiMinus size={18} /></button>
                <input value={manualQty} onChange={e => setManualQty(parseInt(e.target.value) || 1)}
                  type="number" min="1"
                  style={{ flex: 1, padding: '12px 14px', background: '#0f0f13', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 18, fontWeight: 700, textAlign: 'center', outline: 'none' }} />
                <button onClick={() => setManualQty(manualQty + 1)} style={{ padding: '12px', background: '#0f0f13', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', cursor: 'pointer' }}><FiPlus size={18} /></button>
              </div>

              <button onClick={() => { if (manualSku) addScanned(manualSku.trim(), manualQty) }} disabled={!manualSku}
                style={{ width: '100%', padding: '14px', background: manualSku ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#333', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 600, cursor: manualSku ? 'pointer' : 'not-allowed' }}>
                Agregar
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              {scannedList.map((item, i) => (
                <motion.div key={item.sku} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: '#1a1a23', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: '#fff' }}>{item.product_name || item.sku}</p>
                    <p style={{ fontSize: 11, color: '#666', margin: '2px 0 0' }}>SKU: {item.sku}</p>
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#22c55e' }}>{item.actual_qty}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div>
            {history.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '40px 20px' }}>
                <FiPackage size={48} color="#333" style={{ marginBottom: 16 }} />
                <p style={{ color: '#666', fontSize: 13 }}>No hay conteos anteriores</p>
              </motion.div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map(h => (
                <motion.div key={h.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ background: '#1a1a23', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>#{h.id?.toString().slice(-6)}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: h.status === 'completed' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: h.status === 'completed' ? '#22c55e' : '#ef4444' }}>
                      {h.status}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: '#666', margin: 0 }}>{h.item_count} productos · {new Date(h.started_at).toLocaleDateString('es-DO')}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', bottom: 80, left: 20, right: 20, maxWidth: 440, margin: '0 auto', background: '#1a1a23', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, zIndex: 300 }}>
              <FiAlertTriangle color="#ef4444" size={18} />
              <span style={{ fontSize: 13, color: '#ef4444', flex: 1 }}>{error}</span>
              <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}><FiX size={16} /></button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

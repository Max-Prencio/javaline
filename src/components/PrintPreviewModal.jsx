import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiPrinter, FiMaximize2, FiMinimize2 } from 'react-icons/fi'
import paperSizeService from '../services/paperSizeService'

const BACKDROP = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } }
const MODAL = { hidden: { opacity: 0, scale: 0.95, y: 20 }, visible: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.95, y: 20 } }

export default function PrintPreviewModal({ show, onClose, html, title, reportType }) {
  const [paperSizes, setPaperSizes] = useState([])
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [orientation, setOrientation] = useState('portrait')
  const [fullScreen, setFullScreen] = useState(false)
  const iframeRef = useRef(null)

  useEffect(() => {
    if (!show) return
    paperSizeService.list().then(sizes => {
      setPaperSizes(sizes)
      if (reportType) {
        paperSizeService.getPaperSizeFor(reportType).then(ps => {
          setSelectedPaper(ps)
          setOrientation(ps.width > ps.height ? 'landscape' : 'portrait')
        })
      } else if (sizes.length) {
        setSelectedPaper(sizes[0])
      }
    })
  }, [show, reportType])

  useEffect(() => {
    if (!show || !html || !iframeRef.current) return
    const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document
    doc.open()
    doc.write(html)
    doc.close()
  }, [show, html])

  const getEffectivePaper = () => {
    if (!selectedPaper) return null
    const isLandscape = orientation === 'landscape'
    return {
      ...selectedPaper,
      width: isLandscape ? Math.max(selectedPaper.width, selectedPaper.height) : Math.min(selectedPaper.width, selectedPaper.height),
      height: isLandscape ? Math.min(selectedPaper.width, selectedPaper.height) : Math.max(selectedPaper.width, selectedPaper.height),
    }
  }

  const handlePrint = () => {
    if (!iframeRef.current) return
    const iframe = iframeRef.current
    const ps = getEffectivePaper()

    const w = ps?.width ? `size:${ps.width}${ps.unit || 'mm'} ${ps.height}${ps.unit || 'mm'};` : ''
    const m = ps?.category === 'thermal' ? '5mm 4mm' : '12mm 8mm'

    const printStyle = iframe.contentDocument.createElement('style')
    printStyle.textContent = `@page{${w}margin:${m}}@media print{html,body{height:100%!important;margin:0!important;padding:0!important}.no-print{display:none!important}}`
    iframe.contentDocument.head.appendChild(printStyle)

    iframe.contentWindow.focus()
    iframe.contentWindow.print()

    setTimeout(() => {
      if (printStyle.parentNode) printStyle.parentNode.removeChild(printStyle)
    }, 2000)
  }

  if (!show) return null

  const categories = [...new Set(paperSizes.map(s => s.category))]
  const catLabels = { standard: 'Estándar', thermal: 'Térmica / Ticket', envelope: 'Sobres', custom: 'Personalizados' }

  return (
    <AnimatePresence>
      {show && (
        <motion.div variants={BACKDROP} initial="hidden" animate="visible" exit="exit"
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <motion.div variants={MODAL} initial="hidden" animate="visible" exit="exit" transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', width: fullScreen ? '95vw' : 900, maxWidth: '95vw', height: fullScreen ? '92vh' : '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FiPrinter size={20} style={{ color: 'var(--accent)' }} />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Vista Previa de Impresión</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => setFullScreen(!fullScreen)}
                  style={{ padding: 6, background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                  {fullScreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
                </button>
                <button onClick={onClose}
                  style={{ padding: 6, background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                  <FiX size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Sidebar - Configuración */}
              <div style={{ width: 280, borderRight: '1px solid var(--border)', padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Formato de papel */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
                    Formato de Papel
                  </label>
                  {categories.map(cat => (
                    <div key={cat} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>
                        {catLabels[cat] || cat}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {paperSizes.filter(s => s.category === cat).map(ps => (
                          <button key={ps.id} onClick={() => { setSelectedPaper(ps); setOrientation(ps.width > ps.height ? 'landscape' : 'portrait') }}
                            style={{ padding: '8px 10px', borderRadius: 6, border: `1px solid ${selectedPaper?.id === ps.id ? 'var(--accent)' : 'var(--border)'}`, background: selectedPaper?.id === ps.id ? 'rgba(245,158,11,0.1)' : 'transparent', color: selectedPaper?.id === ps.id ? 'var(--accent)' : 'var(--text-primary)', fontSize: 12, fontWeight: 500, cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.15s' }}>
                            <span>{ps.icon} {ps.name}</span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{ps.width}×{ps.height}{ps.unit}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Orientación */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
                    Orientación
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[{ key: 'portrait', label: 'Vertical', icon: '▯' }, { key: 'landscape', label: 'Horizontal', icon: '▭' }].map(o => (
                      <button key={o.key} onClick={() => setOrientation(o.key)}
                        style={{ flex: 1, padding: '10px 8px', borderRadius: 8, border: `1px solid ${orientation === o.key ? 'var(--accent)' : 'var(--border)'}`, background: orientation === o.key ? 'rgba(245,158,11,0.1)' : 'transparent', color: orientation === o.key ? 'var(--accent)' : 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}>
                        <span style={{ fontSize: 20 }}>{o.icon}</span>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info del formato seleccionado */}
                {selectedPaper && (
                  <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Formato seleccionado</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{selectedPaper.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {getEffectivePaper()?.width} × {getEffectivePaper()?.height} mm
                      {selectedPaper.category === 'thermal' && ' (Térmica)'}
                    </div>
                  </div>
                )}

                {/* Botón imprimir */}
                <button onClick={handlePrint}
                  style={{ marginTop: 'auto', padding: '14px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(245,158,11,0.3)', transition: 'transform 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                  <FiPrinter size={18} />
                  Imprimir Ahora
                </button>
              </div>

              {/* Preview */}
              <div style={{ flex: 1, background: '#e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflow: 'auto' }}>
                <div style={{ background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.15)', width: fullScreen ? '100%' : '100%', maxWidth: 700, height: '100%', borderRadius: 2, overflow: 'hidden' }}>
                  <iframe ref={iframeRef} title="Vista previa"
                    style={{ width: '100%', height: '100%', border: 'none' }} />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

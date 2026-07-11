import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiDollarSign, FiPlus, FiX, FiPrinter, FiClock, FiCalendar, FiTrendingUp, FiTrendingDown } from 'react-icons/fi'
import cashRegisterService from '../services/cashRegisterService'
import db from '../services/db'
import { printHtml } from '../utils/print'

function formatMoney(n) { return (n || 0).toLocaleString('es-DO', {minimumFractionDigits:2}) }

export default function CashRegister() {
  const [register, setRegister] = useState(null)
  const [history, setHistory] = useState([])
  const [initialAmount, setInitialAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [reportModal, setReportModal] = useState(null)

  const userId = JSON.parse(localStorage.getItem('javaline_session') || '{}').userId

  const load = useCallback(async () => {
    setRegister(await cashRegisterService.getOpen(userId))
    setHistory((await cashRegisterService.list()).filter(r => r.status === 'closed'))
  }, [userId])

  useEffect(() => { load() }, [load])

  const handleOpen = async () => {
    setLoading(true)
    try {
      const r = await cashRegisterService.open(userId, Number(initialAmount) || 0)
      setRegister(r)
      setInitialAmount('')
    } catch (e) { alert(e.message) }
    setLoading(false)
  }

  const handleClose = async () => {
    if (!register) return
    setLoading(true)
    try {
      await cashRegisterService.close(userId)
      setRegister(null)
      load()
    } catch (e) { alert(e.message) }
    setLoading(false)
  }

  const handlePrintReport = async (reg) => {
    const html = await cashRegisterService.generateReportHtml(reg.id || reg)
    printHtml(html, `Reporte ${reg.id || reg}`, { reportType: 'cash_closing' })
  }

  return (
    <div style={{minHeight:'100vh',background:'var(--bg-primary)',fontFamily:"'Inter', sans-serif",padding:'32px 40px'}}>
      <div style={{maxWidth:1000,margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:32}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <FiDollarSign style={{color:'var(--accent)',fontSize:28}} />
              <h1 style={{color:'var(--text-primary)',fontSize:28,fontWeight:700,margin:0,letterSpacing:'-0.3px'}}>Caja</h1>
            </div>
            <p style={{color:'var(--text-muted)',fontSize:14,margin:'6px 0 0 36px'}}>Gestión de caja y cuadre diario</p>
          </div>
        </div>

        {!register ? (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
            style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,padding:'48px',textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:16}}>🔒</div>
            <h2 style={{color:'var(--text-primary)',fontSize:22,margin:'0 0 8px'}}>Caja Cerrada</h2>
            <p style={{color:'var(--text-muted)',fontSize:14,margin:'0 0 24px'}}>Abre la caja para comenzar a facturar</p>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
              <input type="number" placeholder="Monto inicial (RD$)" value={initialAmount} onChange={e => setInitialAmount(e.target.value)}
                style={{width:240,padding:'13px 16px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:10,color:'var(--text-primary)',fontSize:14,outline:'none',textAlign:'center'}} />
              <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={handleOpen} disabled={loading}
                style={{display:'flex',alignItems:'center',gap:8,padding:'14px 48px',background:'var(--accent-gradient)',border:'none',borderRadius:10,color:'#fff',fontSize:15,fontWeight:600,cursor:'pointer',opacity:loading?0.6:1}}>
                <FiPlus size={18} /> {loading ? 'Abriendo...' : 'Abrir Caja'}
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <>
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
              style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,padding:'28px 32px',marginBottom:20}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                <div>
                  <h2 style={{color:'var(--text-primary)',fontSize:18,margin:'0 0 4px'}}>{register.id}</h2>
                  <p style={{color:'var(--text-muted)',fontSize:13,margin:0}}>Abierta: {new Date(register.openDate).toLocaleString('es-DO')}</p>
                </div>
                <div style={{display:'flex',gap:12,alignItems:'center'}}>
                  <div style={{textAlign:'right'}}>
                    <p style={{fontSize:11,color:'var(--text-muted)',margin:'0 0 2px',textTransform:'uppercase',fontWeight:600}}>Balance Actual</p>
                    <p style={{fontSize:28,fontWeight:700,color:'var(--accent)',margin:0}}>RD$ {formatMoney(register.currentBalance)}</p>
                  </div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
                <div style={{display:'flex',alignItems:'center',gap:12,padding:'16px',background:'rgba(16,185,129,0.08)',borderRadius:10}}>
                  <FiTrendingUp size={20} style={{color:'#10b981'}} />
                  <div><p style={{fontSize:11,color:'var(--text-muted)',margin:'0 0 2px',textTransform:'uppercase',fontWeight:600}}>Ingresos</p><p style={{fontSize:20,fontWeight:700,color:'#10b981',margin:0}}>RD$ {formatMoney(register.totalIncome)}</p></div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:12,padding:'16px',background:'rgba(239,68,68,0.08)',borderRadius:10}}>
                  <FiTrendingDown size={20} style={{color:'#ef4444'}} />
                  <div><p style={{fontSize:11,color:'var(--text-muted)',margin:'0 0 2px',textTransform:'uppercase',fontWeight:600}}>Egresos</p><p style={{fontSize:20,fontWeight:700,color:'#ef4444',margin:0}}>RD$ {formatMoney(register.totalExpense)}</p></div>
                </div>
              </div>
              <div style={{display:'flex',gap:12}}>
                <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={handleClose} disabled={loading}
                  style={{display:'flex',alignItems:'center',gap:8,padding:'12px 24px',background:'#ef4444',border:'none',borderRadius:10,color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer',opacity:loading?0.6:1}}>
                  <FiX size={16} /> {loading ? 'Cerrando...' : 'Cerrar Caja'}
                </motion.button>
                <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={() => handlePrintReport(register.id)}
                  style={{display:'flex',alignItems:'center',gap:8,padding:'12px 24px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:10,color:'var(--text-secondary)',fontSize:14,cursor:'pointer'}}>
                  <FiPrinter size={16} /> Reporte
                </motion.button>
              </div>
            </motion.div>

            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
              style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden'}}>
              <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)'}}>
                <h3 style={{color:'var(--text-primary)',fontSize:14,fontWeight:600,margin:0}}>Transacciones ({register.transactions?.length || 0})</h3>
              </div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>
                  {['ID','Hora','Concepto','Método','Monto'].map(h => (
                    <th key={h} style={{textAlign:'left',padding:'10px 20px',color:'var(--text-muted)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.6px',borderBottom:'1px solid var(--border)'}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {(register.transactions || []).map((t, i) => (
                    <tr key={t.id || i} style={{borderBottom:'1px solid var(--border-light)'}}>
                      <td style={{padding:'10px 20px',color:'var(--text-muted)',fontSize:12,fontFamily:"'JetBrains Mono', monospace"}}>{t.id}</td>
                      <td style={{padding:'10px 20px',color:'var(--text-primary)',fontSize:13}}>{new Date(t.createdAt).toLocaleTimeString('es-DO')}</td>
                      <td style={{padding:'10px 20px',color:'var(--text-primary)',fontSize:13}}>{t.concept || ''}</td>
                      <td style={{padding:'10px 20px',color:'var(--text-secondary)',fontSize:13,textTransform:'capitalize'}}>{t.paymentMethod || 'cash'}</td>
                      <td style={{padding:'10px 20px',fontSize:13,fontWeight:600,color:t.type === 'income' ? '#10b981' : '#ef4444'}}>
                        {t.type === 'income' ? '+' : '-'} RD$ {formatMoney(t.amount)}
                      </td>
                    </tr>
                  ))}
                  {(!register.transactions || register.transactions.length === 0) && (
                    <tr><td colSpan={5} style={{padding:'32px',textAlign:'center',color:'var(--text-muted)',fontSize:13}}>Sin transacciones</td></tr>
                  )}
                </tbody>
              </table>
            </motion.div>
          </>
        )}

        {history.length > 0 && (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} style={{marginTop:24}}>
            <h3 style={{color:'var(--text-primary)',fontSize:16,fontWeight:600,margin:'0 0 12px'}}>Historial de Cierres</h3>
            <div style={{display:'grid',gap:12}}>
              {history.map(r => (
                <div key={r.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 20px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:12}}>
                  <div>
                    <p style={{fontSize:14,fontWeight:600,color:'var(--text-primary)',margin:'0 0 4px'}}>{r.id}</p>
                    <p style={{fontSize:12,color:'var(--text-muted)',margin:0}}>{new Date(r.openDate).toLocaleDateString('es-DO')} — {r.closeDate ? new Date(r.closeDate).toLocaleDateString('es-DO') : 'N/A'}</p>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <p style={{fontSize:16,fontWeight:700,color:'var(--accent)',margin:'0 0 4px'}}>RD$ {formatMoney(r.currentBalance)}</p>
                    <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={() => handlePrintReport(r.id)}
                      style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 12px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-secondary)',fontSize:12,cursor:'pointer'}}>
                      <FiPrinter size={13} /> Reporte
                    </motion.button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

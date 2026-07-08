import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiShoppingCart, FiPlus, FiX, FiPackage, FiSearch, FiShield, FiCheckCircle, FiRefreshCw } from 'react-icons/fi'
import { PURCHASES } from '../data/seed'
import approvalService from '../services/approvalService'
import inventoryService from '../services/inventoryService'
import db from '../services/db'

const statusStyles = {
  recibido: { bg: 'var(--success)', color: '#fff', label: 'Recibido' },
  pendiente: { bg: 'var(--warning)', color: '#fff', label: 'Pendiente' },
  aprobado: { bg: '#6366f1', color: '#fff', label: 'Aprobado' },
  rechazado: { bg: '#ef4444', color: '#fff', label: 'Rechazado' },
}

export default function Purchases() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState(PURCHASES)
  const [modalOpen, setModalOpen] = useState(false)
  const [approvalModal, setApprovalModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [form, setForm] = useState({ supplier: '', item: '', qty: '', total: '', currency: 'DOP' })
  const [hierarchies, setHierarchies] = useState([])
  const [hForm, setHForm] = useState({ currency: 'DOP', role: '', minAmount: '', maxAmount: '' })
  const [receivingId, setReceivingId] = useState(null)

  const session = JSON.parse(localStorage.getItem('javaline_session') || '{}')
  const userId = session.userId || session.id
  const user = session

  const handleReceive = async (order) => {
    setReceivingId(order.id)
    try {
      await inventoryService.receiveFromPurchase(order, userId)
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'recibido', notes: 'Recibido y registrado en inventario' } : o))
      db.addAudit({action:'purchase_receive_manual',store:'purchases',detail:`OC ${order.id} recibida manualmente: ${order.item}`,userId})
      setTimeout(() => setReceivingId(null), 1500)
    } catch (e) {
      alert('Error al recibir: ' + e.message)
      setReceivingId(null)
    }
  }

  const filtered = orders.filter(ord =>
    ord.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ord.item.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalOrdenes = orders.length
  const totalInvertido = orders.reduce((s, o) => s + o.total, 0)
  const pendientes = orders.filter(o => o.status === 'pendiente').length

  const handleChange = (e) => { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.supplier || !form.item || !form.qty || !form.total) return
    const approval = await approvalService.canApprove(form.currency, Number(form.total), user.role)
    const status = approval.allowed ? 'aprobado' : 'pendiente'
    const nextId = `OC-${String(orders.length + 1).padStart(3, '0')}`
    setOrders(prev => [{ id: nextId, supplier: form.supplier, item: form.item, qty: Number(form.qty), total: Number(form.total), status, currency: form.currency, notes: approval.allowed ? '' : `Requiere aprobación de ${approval.requiredRole || 'admin'}` }, ...prev])
    db.addAudit({action:'create_purchase',store:'purchases',detail:`OC ${nextId}: ${form.supplier} - $${form.total} ${form.currency}`,userId})
    setForm({ supplier: '', item: '', qty: '', total: '', currency: 'DOP' })
    setModalOpen(false)
  }

  const loadHierarchies = async () => {
    const h = await approvalService.listHierarchies()
    setHierarchies(h)
  }

  const handleAddHierarchy = async () => {
    if (!hForm.role || !hForm.minAmount || !hForm.maxAmount) return
    await approvalService.createHierarchy(hForm, userId)
    db.addAudit({action:'create_hierarchy',store:'approvalHierarchies',detail:`Jerarquía: ${hForm.currency} ${hForm.role}`,userId})
    setHForm({ currency: 'DOP', role: '', minAmount: '', maxAmount: '' })
    loadHierarchies()
  }

  return (
    <div style={{minHeight:'100vh',background:'var(--bg-primary)',fontFamily:"'Inter', sans-serif",padding:'32px 40px'}}>
      <div style={{maxWidth: 1200, margin: '0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:32}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <FiShoppingCart style={{color:'var(--accent)',fontSize:28}} />
              <h1 style={{color:'var(--text-primary)',fontSize:28,fontWeight:700,margin:0,letterSpacing:'-0.3px'}}>Compras</h1>
            </div>
            <p style={{color:'var(--text-muted)',fontSize:14,margin:'6px 0 0 40px'}}>Gestiona las órdenes de compra de tu empresa</p>
          </div>
          <div style={{display:'flex',gap:12}}>
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={() => { setApprovalModal(true); loadHierarchies() }}
              style={{display:'flex',alignItems:'center',gap:8,padding:'12px 20px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:10,color:'var(--text-secondary)',fontSize:14,cursor:'pointer'}}>
              <FiShield size={16} /> Jerarquías
            </motion.button>
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={() => setModalOpen(true)}
              style={{display:'flex',alignItems:'center',gap:8,padding:'12px 24px',background:'var(--accent-gradient)',border:'none',borderRadius:10,color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer'}}>
              <FiPlus size={18} /> Nueva Orden
            </motion.button>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:16,marginBottom:32}}>
          {[
            { label:'Total órdenes', value: totalOrdenes, color:'var(--accent)' },
            { label:'Total invertido', value: totalInvertido, color:'var(--success)' },
            { label:'Pendientes', value: pendientes, color:'var(--warning)' },
          ].map(item => (
            <motion.div key={item.label} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.4}}
              style={{display:'flex',flexDirection:'column',gap:6,padding:'20px 24px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:14}}>
              <span style={{color:'var(--text-muted)',fontSize:12,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px'}}>{item.label}</span>
              <span style={{fontSize:26,fontWeight:700,letterSpacing:'-0.5px',color:item.color}}>
                {item.label === 'Total invertido' ? `$${item.value.toLocaleString('es-DO')}` : item.value}
              </span>
            </motion.div>
          ))}
        </div>

        <div style={{position:'relative',marginBottom:16}}>
          <FiSearch style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)',fontSize:18,pointerEvents:'none'}} />
          <input placeholder="Buscar por proveedor o artículo..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{width:'100%',padding:'13px 14px 13px 44px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:10,color:'var(--text-primary)',fontSize:14,outline:'none',boxSizing:'border-box'}} />
        </div>

        <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              {['OC#','Proveedor','Artículo','Cant','Moneda','Total','Estado'].map(h => (
                <th key={h} style={{textAlign:'left',padding:'14px 20px',color:'var(--text-muted)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.6px',borderBottom:'1px solid var(--border)',background:'var(--bg-card)'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(ord => {
                const st = statusStyles[ord.status] || statusStyles.pendiente
                return (
                  <tr key={ord.id} style={{borderBottom:'1px solid var(--border-light)'}}>
                    <td style={{padding:'14px 20px',color:'var(--text-muted)',fontSize:13,fontFamily:"'JetBrains Mono', monospace"}}>{ord.id}</td>
                    <td style={{padding:'14px 20px',color:'var(--text-primary)',fontSize:14}}>{ord.supplier}</td>
                    <td style={{padding:'14px 20px',color:'var(--text-primary)',fontSize:14}}><FiPackage size={14} style={{marginRight:8,color:'var(--text-muted)'}} />{ord.item}</td>
                    <td style={{padding:'14px 20px',color:'var(--text-primary)',fontSize:14}}>{ord.qty}</td>
                    <td style={{padding:'14px 20px',color:'var(--text-secondary)',fontSize:13}}>{ord.currency || 'DOP'}</td>
                    <td style={{padding:'14px 20px',fontSize:14,fontWeight:600,color:'var(--text-primary)'}}>${ord.total.toLocaleString('es-DO')}</td>
                    <td style={{padding:'14px 20px'}}>
                      <span style={{display:'inline-flex',padding:'4px 14px',borderRadius:20,fontSize:12,fontWeight:600,background:st.bg,color:st.color}}>{st.label}</span>
                      {ord.notes && <p style={{margin:'4px 0 0',fontSize:11,color:'var(--text-muted)'}}>{ord.notes}</p>}
                      {(ord.status === 'pendiente' || ord.status === 'aprobado') && (
                        <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={() => handleReceive(ord)} disabled={receivingId === ord.id}
                          style={{display:'flex',alignItems:'center',gap:4,marginTop:6,padding:'5px 12px',background:'rgba(34,197,94,0.12)',border:'1px solid rgba(34,197,94,0.25)',borderRadius:8,color:'#22c55e',fontSize:11,fontWeight:600,cursor: receivingId === ord.id ? 'default' : 'pointer',opacity: receivingId === ord.id ? 0.6 : 1}}>
                          {receivingId === ord.id ? <FiRefreshCw size={12} style={{animation:'spin 1s linear infinite'}} /> : <FiCheckCircle size={12} />}
                          {receivingId === ord.id ? 'Recibiendo…' : 'Recibir'}
                        </motion.button>
                      )}
                      {ord.status === 'recibido' && (
                        <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={() => navigate('/inventory')}
                          style={{display:'flex',alignItems:'center',gap:4,marginTop:6,padding:'5px 12px',background:'var(--accent-subtle)',border:'1px solid var(--accent-border)',borderRadius:8,color:'var(--accent)',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                          <FiPackage size={12} /> Ver en inventario
                        </motion.button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <CreateOrderModal open={modalOpen} onClose={() => setModalOpen(false)} form={form} onChange={handleChange} onSubmit={handleSubmit} />
      <ApprovalModal open={approvalModal} onClose={() => setApprovalModal(false)} hierarchies={hierarchies} hForm={hForm} setHForm={setHForm} onAdd={handleAddHierarchy} load={loadHierarchies} />
    </div>
  )
}

function CreateOrderModal({ open, onClose, form, onChange, onSubmit }) {
  if (!open) return null
  return (
    <AnimatePresence>
      <motion.div key="backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        style={{position:'fixed',inset:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)'}} onClick={onClose}>
        <motion.div key="modal" initial={{opacity:0,scale:0.92,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95,y:10}} onClick={e => e.stopPropagation()}
          style={{width:500,padding:'32px 36px 36px',background:'var(--bg-card)',backdropFilter:'blur(24px)',border:'1px solid var(--border)',borderRadius:20,boxShadow:'0 30px 80px rgba(0,0,0,0.6)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <FiShoppingCart style={{color:'var(--accent)',fontSize:22}} />
              <h2 style={{color:'var(--text-primary)',fontSize:20,fontWeight:700,margin:0}}>Nueva Orden de Compra</h2>
            </div>
            <motion.button whileHover={{rotate:90}} onClick={onClose}
              style={{display:'flex',padding:8,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:10,color:'var(--text-muted)',cursor:'pointer'}}><FiX size={20} /></motion.button>
          </div>
          <form onSubmit={onSubmit} style={{display:'flex',flexDirection:'column',gap:20}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div><label style={{color:'var(--text-muted)',fontSize:12,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:6}}>Proveedor</label>
                <input name="supplier" placeholder="Nombre" value={form.supplier} onChange={onChange}
                  style={{width:'100%',padding:'13px 14px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:10,color:'var(--text-primary)',fontSize:14,outline:'none',boxSizing:'border-box'}} /></div>
              <div><label style={{color:'var(--text-muted)',fontSize:12,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:6}}>Moneda</label>
                <select name="currency" value={form.currency} onChange={onChange}
                  style={{width:'100%',padding:'13px 14px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:10,color:'var(--text-primary)',fontSize:14,outline:'none'}}>
                  <option value="DOP">DOP — Peso Dominicano</option><option value="USD">USD — Dólar Americano</option>
                </select></div>
            </div>
            <div><label style={{color:'var(--text-muted)',fontSize:12,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:6}}>Artículo</label>
              <input name="item" placeholder="Nombre del artículo" value={form.item} onChange={onChange}
                style={{width:'100%',padding:'13px 14px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:10,color:'var(--text-primary)',fontSize:14,outline:'none',boxSizing:'border-box'}} /></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div><label style={{color:'var(--text-muted)',fontSize:12,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:6}}>Cantidad</label>
                <input name="qty" type="number" placeholder="0" value={form.qty} onChange={onChange}
                  style={{width:'100%',padding:'13px 14px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:10,color:'var(--text-primary)',fontSize:14,outline:'none',boxSizing:'border-box'}} /></div>
              <div><label style={{color:'var(--text-muted)',fontSize:12,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:6}}>Total</label>
                <input name="total" type="number" placeholder="0" value={form.total} onChange={onChange}
                  style={{width:'100%',padding:'13px 14px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:10,color:'var(--text-primary)',fontSize:14,outline:'none',boxSizing:'border-box'}} /></div>
            </div>
            <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.98}} type="submit"
              style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'14px 0',background:'var(--accent-gradient)',border:'none',borderRadius:10,color:'#fff',fontSize:15,fontWeight:600,cursor:'pointer',marginTop:4}}>
              <FiPlus size={18} /> Crear Orden
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function ApprovalModal({ open, onClose, hierarchies, hForm, setHForm, onAdd, load }) {
  if (!open) return null
  useEffect(() => { if (open) load() }, [open])
  return (
    <AnimatePresence>
      <motion.div key="backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        style={{position:'fixed',inset:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)'}} onClick={onClose}>
        <motion.div key="modal" initial={{opacity:0,scale:0.92,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95,y:10}} onClick={e => e.stopPropagation()}
          style={{width:520,maxHeight:'80vh',overflow:'auto',padding:'32px 36px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:20,boxShadow:'0 30px 80px rgba(0,0,0,0.6)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <FiShield style={{color:'var(--accent)',fontSize:22}} />
              <h2 style={{color:'var(--text-primary)',fontSize:20,fontWeight:700,margin:0}}>Jerarquías de Aprobación</h2>
            </div>
            <motion.button whileHover={{rotate:90}} onClick={onClose}
              style={{display:'flex',padding:8,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:10,color:'var(--text-muted)',cursor:'pointer'}}><FiX size={20} /></motion.button>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8,marginBottom:16}}>
            <div><label style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',display:'block',marginBottom:4}}>Moneda</label>
              <select value={hForm.currency} onChange={e => setHForm({...hForm,currency:e.target.value})}
                style={{width:'100%',padding:'10px 12px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',fontSize:12,outline:'none'}}>
                <option value="DOP">DOP</option><option value="USD">USD</option>
              </select></div>
            <div><label style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',display:'block',marginBottom:4}}>Rol</label>
              <select value={hForm.role} onChange={e => setHForm({...hForm,role:e.target.value})}
                style={{width:'100%',padding:'10px 12px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',fontSize:12,outline:'none'}}>
                <option value="">Seleccionar</option><option value="Empleado">Empleado</option><option value="Gerente">Gerente</option><option value="Administrador">Administrador</option>
              </select></div>
            <div><label style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',display:'block',marginBottom:4}}>Mín</label>
              <input type="number" placeholder="0" value={hForm.minAmount} onChange={e => setHForm({...hForm,minAmount:e.target.value})}
                style={{width:'100%',padding:'10px 12px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',fontSize:12,outline:'none',boxSizing:'border-box'}} /></div>
            <div><label style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',display:'block',marginBottom:4}}>Máx</label>
              <input type="number" placeholder="999999" value={hForm.maxAmount} onChange={e => setHForm({...hForm,maxAmount:e.target.value})}
                style={{width:'100%',padding:'10px 12px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',fontSize:12,outline:'none',boxSizing:'border-box'}} /></div>
          </div>
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={onAdd}
            style={{display:'flex',alignItems:'center',gap:6,padding:'10px 20px',background:'var(--accent-gradient)',border:'none',borderRadius:8,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',marginBottom:20}}>
            <FiPlus size={14} /> Agregar Regla
          </motion.button>

          {hierarchies.length > 0 && (
            <div style={{border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead><tr style={{background:'var(--bg-secondary)'}}>
                  <th style={{padding:'8px 12px',textAlign:'left',color:'var(--text-muted)',fontSize:11,textTransform:'uppercase',fontWeight:600}}>Moneda</th>
                  <th style={{padding:'8px 12px',textAlign:'left',color:'var(--text-muted)',fontSize:11,textTransform:'uppercase',fontWeight:600}}>Rol</th>
                  <th style={{padding:'8px 12px',textAlign:'right',color:'var(--text-muted)',fontSize:11,textTransform:'uppercase',fontWeight:600}}>Desde</th>
                  <th style={{padding:'8px 12px',textAlign:'right',color:'var(--text-muted)',fontSize:11,textTransform:'uppercase',fontWeight:600}}>Hasta</th>
                </tr></thead>
                <tbody>
                  {hierarchies.map(h => (
                    <tr key={h.id} style={{borderTop:'1px solid var(--border-light)'}}>
                      <td style={{padding:'8px 12px',color:'var(--text-primary)'}}>{h.currency}</td>
                      <td style={{padding:'8px 12px',color:'var(--text-primary)'}}>{h.role}</td>
                      <td style={{padding:'8px 12px',textAlign:'right',color:'var(--text-secondary)'}}>${Number(h.minAmount).toLocaleString('es-DO')}</td>
                      <td style={{padding:'8px 12px',textAlign:'right',color:'var(--text-secondary)'}}>${Number(h.maxAmount).toLocaleString('es-DO')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

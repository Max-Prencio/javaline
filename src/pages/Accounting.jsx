import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiBook, FiPlus, FiX, FiSearch, FiList, FiUsers, FiBarChart2, FiDollarSign, FiEdit2, FiTrash2, FiCheck, FiPrinter } from 'react-icons/fi'
import accountingService from '../services/accountingService'
import db from '../services/db'
import { printHtml } from '../utils/print'

function formatMoney(n) { return (n || 0).toLocaleString('es-DO', {minimumFractionDigits:2}) }

export default function Accounting() {
  const [tab, setTab] = useState('accounts')
  const [accounts, setAccounts] = useState([])
  const [journalEntries, setJournalEntries] = useState([])
  const [clients, setClients] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [closings, setClosings] = useState([])

  const load = useCallback(async () => {
    setAccounts(await accountingService.listAccounts())
    setJournalEntries(await accountingService.listJournalEntries())
    setClients(await accountingService.getClientPortfolio())
    const regs = JSON.parse(localStorage.getItem('javaline_cashRegisters') || '[]')
    setClosings(regs.filter(r => r.status === 'closed').sort((a,b) => b.closeDate?.localeCompare(a.closeDate)))
  }, [])

  useEffect(() => { load() }, [load])

  const tabs = [
    { key: 'accounts', label: 'Catálogo de Cuentas', icon: FiList },
    { key: 'journal', label: 'Asientos Contables', icon: FiBarChart2 },
    { key: 'clients', label: 'Cartera de Clientes', icon: FiUsers },
    { key: 'balances', label: 'Balances', icon: FiDollarSign },
    { key: 'closings', label: 'Cuadre de Caja', icon: FiPrinter },
  ]

  return (
    <div style={{minHeight:'100vh',background:'var(--bg-primary)',fontFamily:"'Inter', sans-serif",padding:'32px 40px'}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
          <FiBook style={{color:'var(--accent)',fontSize:28}} />
          <h1 style={{color:'var(--text-primary)',fontSize:28,fontWeight:700,margin:0,letterSpacing:'-0.3px'}}>Contabilidad</h1>
        </div>

        <div style={{display:'flex',gap:8,marginBottom:24,borderBottom:'1px solid var(--border)',paddingBottom:0}}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{display:'flex',alignItems:'center',gap:8,padding:'12px 20px',background:'none',border:'none',borderBottom:`2px solid ${tab === t.key ? 'var(--accent)' : 'transparent'}`,color: tab === t.key ? 'var(--accent)' : 'var(--text-muted)',fontSize:13,fontWeight:600,cursor:'pointer',transition:'all 0.2s'}}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'accounts' && <AccountsTab accounts={accounts} load={load} />}
        {tab === 'journal' && <JournalTab entries={journalEntries} load={load} accounts={accounts} />}
        {tab === 'clients' && <ClientsTab clients={clients} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
        {tab === 'balances' && <BalancesTab />}
        {tab === 'closings' && <CashClosingsTab closings={closings} />}
      </div>
    </div>
  )
}

function AccountsTab({ accounts, load }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ code: '', name: '', type: 'activo', nature: 'deudora', level: 3 })
  const userId = JSON.parse(localStorage.getItem('javaline_session') || '{}').userId

  const handleCreate = async () => {
    if (!form.code || !form.name) return
    await accountingService.createAccount(form, userId)
    // Audit ya registrado dentro de accountingService.createAccount
    setForm({code:'',name:'',type:'activo',nature:'deudora',level:3})
    setShowForm(false); load()
  }

  const filtered = accounts

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <p style={{color:'var(--text-muted)',fontSize:14,margin:0}}>{accounts.length} cuentas</p>
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={() => setShowForm(!showForm)}
          style={{display:'flex',alignItems:'center',gap:8,padding:'10px 20px',background:'var(--accent-gradient)',border:'none',borderRadius:10,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>
          <FiPlus size={16} /> Nueva Cuenta
        </motion.button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
            style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:12,padding:'20px',marginBottom:16,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div><label style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',display:'block',marginBottom:6}}>Código</label>
                <input value={form.code} onChange={e => setForm({...form,code:e.target.value})} placeholder="1.01.001"
                  style={{width:'100%',padding:'11px 14px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',fontSize:13,outline:'none',boxSizing:'border-box'}} /></div>
              <div><label style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',display:'block',marginBottom:6}}>Nombre</label>
                <input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Caja General"
                  style={{width:'100%',padding:'11px 14px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',fontSize:13,outline:'none',boxSizing:'border-box'}} /></div>
              <div><label style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',display:'block',marginBottom:6}}>Tipo</label>
                <select value={form.type} onChange={e => setForm({...form,type:e.target.value})}
                  style={{width:'100%',padding:'11px 14px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',fontSize:13,outline:'none'}}>
                  <option value="activo">Activo</option><option value="pasivo">Pasivo</option><option value="patrimonio">Patrimonio</option><option value="ingreso">Ingreso</option><option value="costo">Costo</option><option value="gasto">Gasto</option>
                </select></div>
              <div><label style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',display:'block',marginBottom:6}}>Naturaleza</label>
                <select value={form.nature} onChange={e => setForm({...form,nature:e.target.value})}
                  style={{width:'100%',padding:'11px 14px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',fontSize:13,outline:'none'}}>
                  <option value="deudora">Deudora</option><option value="acreedora">Acreedora</option>
                </select></div>
            </div>
            <div style={{display:'flex',gap:8,marginTop:16}}>
              <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={handleCreate}
                style={{padding:'10px 24px',background:'var(--accent-gradient)',border:'none',borderRadius:8,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                <FiCheck size={14} style={{marginRight:6}} />Crear
              </motion.button>
              <button onClick={() => setShowForm(false)} style={{padding:'10px 24px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-muted)',fontSize:13,cursor:'pointer'}}>Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            {['Código','Nombre','Tipo','Naturaleza','Nivel','Estado'].map(h => (
              <th key={h} style={{textAlign:'left',padding:'12px 20px',color:'var(--text-muted)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.6px',borderBottom:'1px solid var(--border)'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} style={{borderBottom:'1px solid var(--border-light)'}}>
                <td style={{padding:'12px 20px',fontSize:13,color:'var(--text-muted)',fontFamily:"'JetBrains Mono', monospace"}}>{a.code}</td>
                <td style={{padding:'12px 20px',fontSize:14,color:'var(--text-primary)',fontWeight:600}}>{a.name}</td>
                <td style={{padding:'12px 20px',fontSize:13,color:'var(--text-secondary)',textTransform:'capitalize'}}>{a.type}</td>
                <td style={{padding:'12px 20px',fontSize:13,color:'var(--text-secondary)'}}>{a.nature}</td>
                <td style={{padding:'12px 20px',fontSize:13,color:'var(--text-secondary)'}}>{a.level}</td>
                <td style={{padding:'12px 20px'}}>
                  <span style={{display:'inline-flex',padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:a.active !== false ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',color:a.active !== false ? '#10b981' : '#ef4444'}}>
                    {a.active !== false ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function JournalTab({ entries, load, accounts }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), concept: '', lines: [{accountId:'',debit:'',credit:''}] })
  const userId = JSON.parse(localStorage.getItem('javaline_session') || '{}').userId

  const addLine = () => setForm({...form, lines: [...form.lines, {accountId:'',debit:'',credit:''}] })
  const updateLine = (i, field, val) => {
    const lines = form.lines.map((l, idx) => idx === i ? {...l, [field]: val} : l)
    setForm({...form, lines})
  }
  const removeLine = (i) => setForm({...form, lines: form.lines.filter((_, idx) => idx !== i) })

  const handleCreate = async () => {
    const lines = form.lines.map(l => ({accountId: l.accountId, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0}))
    if (lines.length === 0 || lines.every(l => !l.debit && !l.credit)) return
    await accountingService.createJournalEntry({date: form.date, concept: form.concept, lines}, userId)
    // Audit ya registrado dentro de accountingService.createJournalEntry
    setForm({date: new Date().toISOString().slice(0,10), concept: '', lines: [{accountId:'',debit:'',credit:''}]})
    setShowForm(false); load()
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <p style={{color:'var(--text-muted)',fontSize:14,margin:0}}>{entries.length} asientos</p>
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={() => setShowForm(!showForm)}
          style={{display:'flex',alignItems:'center',gap:8,padding:'10px 20px',background:'var(--accent-gradient)',border:'none',borderRadius:10,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>
          <FiPlus size={16} /> Nuevo Asiento
        </motion.button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
            style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:12,padding:'20px',marginBottom:16,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:16,marginBottom:16}}>
              <div><label style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',display:'block',marginBottom:6}}>Fecha</label>
                <input type="date" value={form.date} onChange={e => setForm({...form,date:e.target.value})}
                  style={{width:'100%',padding:'11px 14px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',fontSize:13,outline:'none',boxSizing:'border-box'}} /></div>
              <div><label style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',display:'block',marginBottom:6}}>Concepto</label>
                <input value={form.concept} onChange={e => setForm({...form,concept:e.target.value})} placeholder="Descripción del asiento"
                  style={{width:'100%',padding:'11px 14px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',fontSize:13,outline:'none',boxSizing:'border-box'}} /></div>
            </div>
            <p style={{fontSize:12,fontWeight:600,color:'var(--text-muted)',margin:'0 0 8px',textTransform:'uppercase'}}>Líneas del Asiento</p>
            {form.lines.map((l, i) => (
              <div key={i} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr auto',gap:8,marginBottom:8,alignItems:'end'}}>
                <div><select value={l.accountId} onChange={e => updateLine(i,'accountId',e.target.value)}
                  style={{width:'100%',padding:'10px 12px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',fontSize:12,outline:'none'}}>
                  <option value="">Seleccionar cuenta</option>
                  {accounts.filter(a => a.active !== false).map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                </select></div>
                <div><input type="number" placeholder="Débito" value={l.debit} onChange={e => updateLine(i,'debit',e.target.value)}
                  style={{width:'100%',padding:'10px 12px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',fontSize:12,outline:'none',boxSizing:'border-box'}} /></div>
                <div><input type="number" placeholder="Crédito" value={l.credit} onChange={e => updateLine(i,'credit',e.target.value)}
                  style={{width:'100%',padding:'10px 12px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',fontSize:12,outline:'none',boxSizing:'border-box'}} /></div>
                <button onClick={() => removeLine(i)} style={{padding:'10px',background:'rgba(239,68,68,0.1)',border:'none',borderRadius:8,color:'#ef4444',cursor:'pointer'}}><FiTrash2 size={14} /></button>
              </div>
            ))}
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={addLine}
              style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-secondary)',fontSize:12,cursor:'pointer',marginBottom:16}}>
              <FiPlus size={14} /> Agregar línea
            </motion.button>
            <div style={{display:'flex',gap:8}}>
              <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={handleCreate}
                style={{padding:'10px 24px',background:'var(--accent-gradient)',border:'none',borderRadius:8,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                <FiCheck size={14} style={{marginRight:6}} />Guardar
              </motion.button>
              <button onClick={() => setShowForm(false)} style={{padding:'10px 24px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-muted)',fontSize:13,cursor:'pointer'}}>Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            {['ID','Fecha','Concepto','Débito','Crédito','Estado'].map(h => (
              <th key={h} style={{textAlign:'left',padding:'12px 20px',color:'var(--text-muted)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.6px',borderBottom:'1px solid var(--border)'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.id} style={{borderBottom:'1px solid var(--border-light)'}}>
                <td style={{padding:'12px 20px',fontSize:12,color:'var(--text-muted)',fontFamily:"'JetBrains Mono', monospace"}}>{e.id}</td>
                <td style={{padding:'12px 20px',fontSize:13,color:'var(--text-primary)'}}>{e.date}</td>
                <td style={{padding:'12px 20px',fontSize:13,color:'var(--text-primary)',fontWeight:500}}>{e.concept}</td>
                <td style={{padding:'12px 20px',fontSize:13,color:'var(--text-primary)'}}>${formatMoney(e.totalDebit)}</td>
                <td style={{padding:'12px 20px',fontSize:13,color:'var(--text-primary)'}}>${formatMoney(e.totalCredit)}</td>
                <td style={{padding:'12px 20px'}}>
                  <span style={{display:'inline-flex',padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:600,background: e.status === 'posted' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',color: e.status === 'posted' ? '#10b981' : '#f59e0b'}}>
                    {e.status === 'posted' ? 'Contabilizado' : 'Borrador'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ClientsTab({ clients, searchQuery, setSearchQuery }) {
  const filtered = clients.filter(c => (c.name||'').toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div>
      <div style={{position:'relative',marginBottom:16}}>
        <FiSearch style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)',fontSize:18,pointerEvents:'none'}} />
        <input placeholder="Buscar cliente..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          style={{width:'100%',padding:'13px 14px 13px 44px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:10,color:'var(--text-primary)',fontSize:14,outline:'none',boxSizing:'border-box'}} />
      </div>
      <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            {['Nombre','Empresa','Email','Teléfono','Tipo','RNC'].map(h => (
              <th key={h} style={{textAlign:'left',padding:'12px 20px',color:'var(--text-muted)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.6px',borderBottom:'1px solid var(--border)'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} style={{borderBottom:'1px solid var(--border-light)'}}>
                <td style={{padding:'12px 20px',fontSize:14,color:'var(--text-primary)',fontWeight:600}}>{c.name}</td>
                <td style={{padding:'12px 20px',fontSize:13,color:'var(--text-secondary)'}}>{c.company || '-'}</td>
                <td style={{padding:'12px 20px',fontSize:13,color:'var(--text-secondary)'}}>{c.email}</td>
                <td style={{padding:'12px 20px',fontSize:13,color:'var(--text-secondary)'}}>{c.phone}</td>
                <td style={{padding:'12px 20px'}}>
                  <span style={{display:'inline-flex',padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:600,
                    background: c.type === 'company' ? 'rgba(99,102,241,0.1)' : c.type === 'supplier' ? 'rgba(249,115,22,0.1)' : 'rgba(16,185,129,0.1)',
                    color: c.type === 'company' ? '#6366f1' : c.type === 'supplier' ? '#f97316' : '#10b981'}}>
                    {c.type === 'company' ? 'Empresa' : c.type === 'supplier' ? 'Proveedor' : 'Individual'}
                  </span>
                </td>
                <td style={{padding:'12px 20px',fontSize:13,color:'var(--text-muted)'}}>{c.rnc || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BalancesTab() {
  const [accounts, setAccounts] = useState([])
  const [period, setPeriod] = useState({ from: '2026-01-01', to: '2026-12-31' })

  useEffect(() => {
    accountingService.getBalanceSheet(period.to).then(setAccounts)
  }, [period])

  const byType = {}
  accounts.forEach(a => { if (!byType[a.type]) byType[a.type] = []; byType[a.type].push(a) })

  return (
    <div>
      <div style={{display:'flex',gap:16,marginBottom:20,alignItems:'end'}}>
        <div><label style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',display:'block',marginBottom:6}}>Desde</label>
          <input type="date" value={period.from} onChange={e => setPeriod({...period,from:e.target.value})}
            style={{padding:'11px 14px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',fontSize:13,outline:'none'}} /></div>
        <div><label style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',display:'block',marginBottom:6}}>Hasta</label>
          <input type="date" value={period.to} onChange={e => setPeriod({...period,to:e.target.value})}
            style={{padding:'11px 14px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',fontSize:13,outline:'none'}} /></div>
      </div>

      {Object.entries(byType).map(([type, accts]) => {
        const total = accts.reduce((s, a) => s + (a.balance || 0), 0)
        const colorMap = {activo:'#6366f1',pasivo:'#f97316',patrimonio:'#10b981',ingreso:'#f59e0b',costo:'#ef4444',gasto:'#ef4444'}
        return (
          <div key={type} style={{marginBottom:20}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <h3 style={{fontSize:15,fontWeight:600,color:'var(--text-primary)',margin:0,textTransform:'capitalize'}}>{type}</h3>
              <span style={{fontSize:16,fontWeight:700,color:colorMap[type] || 'var(--text-primary)'}}>${formatMoney(total)}</span>
            </div>
            <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:'var(--bg-secondary)'}}>
                  <th style={{textAlign:'left',padding:'8px 16px',color:'var(--text-muted)',fontSize:11,fontWeight:600,textTransform:'uppercase'}}>Cuenta</th>
                  <th style={{textAlign:'right',padding:'8px 16px',color:'var(--text-muted)',fontSize:11,fontWeight:600,textTransform:'uppercase'}}>Saldo</th>
                </tr></thead>
                <tbody>
                  {accts.map(a => (
                    <tr key={a.id} style={{borderTop:'1px solid var(--border-light)'}}>
                      <td style={{padding:'8px 16px',fontSize:13,color:'var(--text-primary)'}}><span style={{color:'var(--text-muted)',fontFamily:"'JetBrains Mono',monospace"}}>{a.code}</span> — {a.name}</td>
                      <td style={{padding:'8px 16px',textAlign:'right',fontSize:13,fontWeight:600,color:a.balance >= 0 ? '#10b981' : '#ef4444'}}>${formatMoney(a.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CashClosingsTab({ closings }) {
  const printClosing = (r) => {
    const html = `
        <h1 style="font-size:22px;font-weight:700;margin:0 0 4px">Cuadre de Caja</h1>
        <div style="color:#666;font-size:13px;margin-bottom:24px">ID: ${r.id} — Apertura: ${new Date(r.openDate).toLocaleString('es-DO')} — Cierre: ${new Date(r.closeDate).toLocaleString('es-DO')}</div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <tr><th style="text-align:left;padding:10px 16px;background:#f5f5f5;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#666;border-bottom:2px solid #eee">Concepto</th><th style="text-align:left;padding:10px 16px;background:#f5f5f5;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#666;border-bottom:2px solid #eee">Valor</th></tr>
          <tr><td style="padding:10px 16px;border-bottom:1px solid #eee;font-size:14px">Saldo Inicial</td><td style="padding:10px 16px;border-bottom:1px solid #eee;font-size:14px">$${formatMoney(r.initialBalance)}</td></tr>
          <tr><td style="padding:10px 16px;border-bottom:1px solid #eee;font-size:14px">Ingresos</td><td style="padding:10px 16px;border-bottom:1px solid #eee;font-size:14px">$${formatMoney(r.totalIncome)}</td></tr>
          <tr><td style="padding:10px 16px;border-bottom:1px solid #eee;font-size:14px">Egresos</td><td style="padding:10px 16px;border-bottom:1px solid #eee;font-size:14px">$${formatMoney(r.totalExpense)}</td></tr>
          <tr><td style="padding:10px 16px;border-bottom:1px solid #eee;font-size:14px;font-weight:700">Saldo Final</td><td style="padding:10px 16px;border-bottom:1px solid #eee;font-size:16px;font-weight:700">$${formatMoney(r.currentBalance)}</td></tr>
        </table>
        <h3 style="font-size:14px;font-weight:600;margin:0 0 8px">Asiento Contable Generado</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <tr><th style="text-align:left;padding:10px 16px;background:#f5f5f5;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#666;border-bottom:2px solid #eee">Cuenta</th><th style="text-align:left;padding:10px 16px;background:#f5f5f5;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#666;border-bottom:2px solid #eee">Débito</th><th style="text-align:left;padding:10px 16px;background:#f5f5f5;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#666;border-bottom:2px solid #eee">Crédito</th></tr>
          <tr><td style="padding:10px 16px;border-bottom:1px solid #eee;font-size:14px">Caja General</td><td style="padding:10px 16px;border-bottom:1px solid #eee;font-size:14px">$${formatMoney(r.currentBalance)}</td><td style="padding:10px 16px;border-bottom:1px solid #eee;font-size:14px">—</td></tr>
          <tr><td style="padding:10px 16px;border-bottom:1px solid #eee;font-size:14px">Ingresos por Ventas</td><td style="padding:10px 16px;border-bottom:1px solid #eee;font-size:14px">—</td><td style="padding:10px 16px;border-bottom:1px solid #eee;font-size:14px">$${formatMoney(r.totalIncome)}</td></tr>
          <tr><td style="padding:10px 16px;border-bottom:1px solid #eee;font-size:14px">Gastos Operativos</td><td style="padding:10px 16px;border-bottom:1px solid #eee;font-size:14px">$${formatMoney(r.totalExpense)}</td><td style="padding:10px 16px;border-bottom:1px solid #eee;font-size:14px">—</td></tr>
          <tr><td style="padding:10px 16px;border-bottom:1px solid #eee;font-size:14px">Banco Comercial</td><td style="padding:10px 16px;border-bottom:1px solid #eee;font-size:14px">—</td><td style="padding:10px 16px;border-bottom:1px solid #eee;font-size:14px">$${formatMoney(r.initialBalance)}</td></tr>
        </table>`
    printHtml(html, `cuadre-${r.id}`, { reportType: 'cash_closing' })
  }

  const totalIncome = closings.reduce((s,r) => s + (r.totalIncome||0), 0)
  const totalExpense = closings.reduce((s,r) => s + (r.totalExpense||0), 0)

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:24}}>
        <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:12,padding:'20px'}}>
          <p style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',margin:'0 0 4px'}}>Cierres</p>
          <p style={{fontSize:28,fontWeight:700,color:'var(--text-primary)',margin:0}}>{closings.length}</p>
        </div>
        <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:12,padding:'20px'}}>
          <p style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',margin:'0 0 4px'}}>Ingresos Totales</p>
          <p style={{fontSize:28,fontWeight:700,color:'var(--accent)',margin:0}}>${formatMoney(totalIncome)}</p>
        </div>
        <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:12,padding:'20px'}}>
          <p style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',margin:'0 0 4px'}}>Egresos Totales</p>
          <p style={{fontSize:28,fontWeight:700,color:'#ef4444',margin:0}}>${formatMoney(totalExpense)}</p>
        </div>
      </div>

      <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            {['ID','Apertura','Cierre','Inicial','Ingresos','Gastos','Saldo Final',''].map(h => (
              <th key={h} style={{textAlign:'left',padding:'12px 16px',color:'var(--text-muted)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.6px',borderBottom:'1px solid var(--border)'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {closings.map(r => (
              <tr key={r.id} style={{borderBottom:'1px solid var(--border-light)'}}>
                <td style={{padding:'12px 16px',fontSize:12,color:'var(--text-muted)',fontFamily:"'JetBrains Mono',monospace"}}>{r.id}</td>
                <td style={{padding:'12px 16px',fontSize:13,color:'var(--text-primary)'}}>{new Date(r.openDate).toLocaleDateString('es-DO')}</td>
                <td style={{padding:'12px 16px',fontSize:13,color:'var(--text-primary)'}}>{new Date(r.closeDate).toLocaleDateString('es-DO')}</td>
                <td style={{padding:'12px 16px',fontSize:13,color:'var(--text-primary)'}}>${formatMoney(r.initialBalance)}</td>
                <td style={{padding:'12px 16px',fontSize:13,color:'var(--text-primary)'}}>${formatMoney(r.totalIncome)}</td>
                <td style={{padding:'12px 16px',fontSize:13,color:'var(--text-primary)'}}>${formatMoney(r.totalExpense)}</td>
                <td style={{padding:'12px 16px',fontSize:14,fontWeight:700,color:'var(--text-primary)'}}>${formatMoney(r.currentBalance)}</td>
                <td style={{padding:'12px 16px'}}>
                  <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={() => printClosing(r)}
                    style={{padding:'6px 12px',background:'var(--accent-gradient)',border:'none',borderRadius:6,color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                    <FiPrinter size={12} /> Imprimir
                  </motion.button>
                </td>
              </tr>
            ))}
            {closings.length === 0 && (
              <tr><td colSpan={8} style={{padding:'40px',textAlign:'center',color:'var(--text-muted)',fontSize:14}}>No hay cierres registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

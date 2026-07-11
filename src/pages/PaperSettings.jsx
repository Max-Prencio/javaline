import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSettings, FiPlus, FiX, FiSearch, FiCheck, FiTrash2, FiPrinter, FiSave } from 'react-icons/fi'
import paperSizeService from '../services/paperSizeService'
import db from '../services/db'

function formatMM(n) { return n != null ? `${n}mm` : '-' }

export default function PaperSettings() {
  const [tab, setTab] = useState('sizes')
  const [sizes, setSizes] = useState([])
  const [configs, setConfigs] = useState([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', width: '', height: '', unit: 'mm', category: 'custom', icon: '📐' })

  const userId = JSON.parse(localStorage.getItem('javaline_session') || '{}').userId

  const load = async () => {
    setSizes(await paperSizeService.list())
    setConfigs(await paperSizeService.getConfigs())
  }

  useEffect(() => { load() }, [])

  const filtered = search
    ? sizes.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase()) ||
        `${s.width}x${s.height}`.includes(search)
      )
    : sizes

  const handleCreate = async () => {
    if (!form.name || !form.width || !form.height) return
    await paperSizeService.create(form)
    db.addAudit({action:'create_paper_size',store:'paperSizes',detail:`Formato creado: ${form.name} (${form.width}x${form.height}mm)`,userId})
    setForm({name:'',width:'',height:'',unit:'mm',category:'custom',icon:'📐'})
    setShowForm(false)
    load()
  }

  const handleDelete = async (id) => {
    await paperSizeService.remove(id)
    db.addAudit({action:'delete_paper_size',store:'paperSizes',detail:`Formato eliminado: ${id}`,userId})
    load()
  }

  const handleConfigChange = async (reportType, paperSizeId) => {
    await paperSizeService.setConfig(reportType, paperSizeId)
    db.addAudit({action:'set_paper_config',store:'paperConfigs',detail:`${reportType} → ${paperSizeId}`,userId})
    load()
  }

  const categories = [...new Set(sizes.map(s => s.category))]

  const catLabels = { standard: 'Estándar', thermal: 'Térmica / Ticket', envelope: 'Sobres', custom: 'Personalizados' }
  const catIcons = { standard: '📄', thermal: '🧾', envelope: '✉️', custom: '📐' }

  return (
    <div style={{minHeight:'100vh',background:'var(--bg-primary)',fontFamily:"'Inter', sans-serif",padding:'32px 40px'}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
          <FiPrinter style={{color:'var(--accent)',fontSize:28}} />
          <h1 style={{color:'var(--text-primary)',fontSize:28,fontWeight:700,margin:0,letterSpacing:'-0.3px'}}>Formatos de Papel</h1>
        </div>

        <div style={{display:'flex',gap:8,marginBottom:24,borderBottom:'1px solid var(--border)',paddingBottom:0}}>
          {[
            { key:'sizes', label:'Formatos Disponibles', icon:FiPrinter },
            { key:'mapping', label:'Asignación por Reporte', icon:FiSave },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{display:'flex',alignItems:'center',gap:8,padding:'12px 20px',background:'none',border:'none',borderBottom:`2px solid ${tab === t.key ? 'var(--accent)' : 'transparent'}`,color: tab === t.key ? 'var(--accent)' : 'var(--text-muted)',fontSize:13,fontWeight:600,cursor:'pointer',transition:'all 0.2s'}}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'sizes' && (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,gap:12}}>
              <div style={{position:'relative',flex:1}}>
                <FiSearch style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)',fontSize:16,pointerEvents:'none'}} />
                <input placeholder="Buscar formato (nombre, categoría, ej: 80x297)..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{width:'100%',padding:'12px 14px 12px 42px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:10,color:'var(--text-primary)',fontSize:13,outline:'none',boxSizing:'border-box'}} />
              </div>
              <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={() => setShowForm(!showForm)}
                style={{display:'flex',alignItems:'center',gap:8,padding:'11px 20px',background:'var(--accent-gradient)',border:'none',borderRadius:10,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}}>
                <FiPlus size={16} /> Nuevo Formato
              </motion.button>
            </div>

            <AnimatePresence>
              {showForm && (
                <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
                  style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:12,padding:'20px',marginBottom:16,overflow:'hidden'}}>
                  <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:12,alignItems:'end'}}>
                    <div><label style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',marginBottom:6,display:'block'}}>Nombre</label>
                      <input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Ej: Ticket 80mm Personalizado"
                        style={{width:'100%',padding:'11px 14px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',fontSize:13,outline:'none',boxSizing:'border-box'}} /></div>
                    <div><label style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',marginBottom:6,display:'block'}}>Ancho (mm)</label>
                      <input type="number" step="0.1" value={form.width} onChange={e => setForm({...form,width:e.target.value})} placeholder="80"
                        style={{width:'100%',padding:'11px 14px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',fontSize:13,outline:'none',boxSizing:'border-box'}} /></div>
                    <div><label style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',marginBottom:6,display:'block'}}>Alto (mm)</label>
                      <input type="number" step="0.1" value={form.height} onChange={e => setForm({...form,height:e.target.value})} placeholder="297"
                        style={{width:'100%',padding:'11px 14px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',fontSize:13,outline:'none',boxSizing:'border-box'}} /></div>
                    <div style={{display:'flex',gap:8,alignItems:'end',paddingBottom:2}}>
                      <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={handleCreate}
                        style={{padding:'11px 24px',background:'var(--accent-gradient)',border:'none',borderRadius:8,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                        <FiCheck size={14} style={{marginRight:6}} />Crear
                      </motion.button>
                      <button onClick={() => setShowForm(false)}
                        style={{padding:'11px 20px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-muted)',fontSize:13,cursor:'pointer'}}>Cancelar</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {categories.map(cat => {
              const items = filtered.filter(s => s.category === cat)
              if (!items.length) return null
              return (
                <div key={cat} style={{marginBottom:24}}>
                  <h3 style={{fontSize:14,fontWeight:600,color:'var(--text-primary)',margin:'0 0 10px',display:'flex',alignItems:'center',gap:8}}>
                    <span>{catIcons[cat] || '📄'}</span> {catLabels[cat] || cat}
                    <span style={{fontSize:12,fontWeight:400,color:'var(--text-muted)'}}>({items.length})</span>
                  </h3>
                  <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden'}}>
                    <table style={{width:'100%',borderCollapse:'collapse'}}>
                      <thead><tr>
                        {['Nombre','Tamaño','Ancho','Alto','Acciones'].map(h => (
                          <th key={h} style={{textAlign:'left',padding:'10px 16px',color:'var(--text-muted)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.6px',borderBottom:'1px solid var(--border)'}}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {items.map(s => (
                          <tr key={s.id} style={{borderBottom:'1px solid var(--border-light)'}}>
                            <td style={{padding:'10px 16px',fontSize:14,color:'var(--text-primary)',fontWeight:600,display:'flex',alignItems:'center',gap:8}}>
                              <span>{s.icon || '📄'}</span> {s.name}
                              {s.id.startsWith('PAPER-CUSTOM-') && (
                                <span style={{fontSize:10,background:'rgba(245,158,11,0.1)',color:'var(--accent)',padding:'2px 8px',borderRadius:10,fontWeight:600}}>Personalizado</span>
                              )}
                            </td>
                            <td style={{padding:'10px 16px',fontSize:13,color:'var(--text-secondary)',fontFamily:"'JetBrains Mono',monospace"}}>{s.width} × {s.height} {s.unit}</td>
                            <td style={{padding:'10px 16px',fontSize:13,color:'var(--text-secondary)'}}>{formatMM(s.width)}</td>
                            <td style={{padding:'10px 16px',fontSize:13,color:'var(--text-secondary)'}}>{formatMM(s.height)}</td>
                            <td style={{padding:'10px 16px',fontSize:13}}>
                              {s.id.includes('CUSTOM') ? (
                                <button onClick={() => handleDelete(s.id)}
                                  style={{padding:'6px 10px',background:'rgba(239,68,68,0.1)',border:'none',borderRadius:6,color:'#ef4444',fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                                  <FiTrash2 size={12} /> Eliminar
                                </button>
                              ) : (
                                <span style={{fontSize:11,color:'var(--text-muted)'}}>Predefinido</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}

            {filtered.length === 0 && (
              <div style={{textAlign:'center',padding:'60px 20px',color:'var(--text-muted)'}}>
                <p style={{fontSize:16,margin:'0 0 8px'}}>No se encontraron formatos</p>
                <p style={{fontSize:13,margin:0}}>Prueba con otra búsqueda o crea un nuevo formato</p>
              </div>
            )}
          </div>
        )}

        {tab === 'mapping' && (
          <div>
            <p style={{fontSize:13,color:'var(--text-muted)',marginBottom:16}}>
              Asigna qué tamaño de papel se usará para cada tipo de reporte al imprimir
            </p>
            <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>
                  {['Tipo de Reporte','Formato Actual','Cambiar Formato'].map(h => (
                    <th key={h} style={{textAlign:'left',padding:'12px 20px',color:'var(--text-muted)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.6px',borderBottom:'1px solid var(--border)'}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {configs.map(c => {
                    const currentSize = sizes.find(s => s.id === c.paperSizeId)
                    return (
                      <tr key={c.reportType} style={{borderBottom:'1px solid var(--border-light)'}}>
                        <td style={{padding:'12px 20px',fontSize:14,color:'var(--text-primary)',fontWeight:600}}>{c.label}</td>
                        <td style={{padding:'12px 20px',fontSize:13,color:'var(--text-primary)'}}>
                          <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',background:'rgba(245,158,11,0.1)',borderRadius:8,color:'var(--accent)',fontWeight:600}}>
                            {currentSize?.icon || '📄'} {currentSize?.name || c.paperSizeId}
                            <span style={{fontSize:10,color:'var(--text-muted)',fontWeight:400,fontFamily:"'JetBrains Mono',monospace"}}>{currentSize ? `${currentSize.width}×${currentSize.height}${currentSize.unit}` : ''}</span>
                          </span>
                        </td>
                        <td style={{padding:'12px 20px'}}>
                          <select value={c.paperSizeId} onChange={e => handleConfigChange(c.reportType, e.target.value)}
                            style={{padding:'8px 12px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',fontSize:12,outline:'none',maxWidth:260}}>
                            {sizes.map(s => (
                              <option key={s.id} value={s.id}>{s.icon} {s.name} ({s.width}×{s.height}{s.unit})</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

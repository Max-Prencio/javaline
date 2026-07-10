import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiTrendingUp, FiDollarSign, FiFileText, FiUsers, FiShoppingBag, FiSettings } from 'react-icons/fi'
import { invoiceService, contactService, productService } from '../services/entityService'

function KpiCard({ icon: Icon, label, value, sub }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-5" style={{background: 'var(--bg-card)', border: '1px solid var(--border)'}}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider" style={{color: 'var(--text-muted)'}}>{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background: 'var(--accent-subtle)'}}>
          <Icon size={16} style={{color: 'var(--accent)'}} />
        </div>
      </div>
      <p className="text-2xl font-bold" style={{color: 'var(--text-primary)'}}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{color: 'var(--text-muted)'}}>{sub}</p>}
    </motion.div>
  )
}

const MONTHLY_REVENUE = [
  { month: 'Ene', ingresos: 320000, gastos: 180000, facturas: 12 },
  { month: 'Feb', ingresos: 280000, gastos: 165000, facturas: 10 },
  { month: 'Mar', ingresos: 450000, gastos: 210000, facturas: 15 },
  { month: 'Abr', ingresos: 380000, gastos: 195000, facturas: 13 },
  { month: 'May', ingresos: 520000, gastos: 240000, facturas: 18 },
  { month: 'Jun', ingresos: 610000, gastos: 275000, facturas: 20 },
]

export default function Reports() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [contacts, setContacts] = useState([])
  const [products, setProducts] = useState([])

  const load = useCallback(async () => {
    setInvoices(await invoiceService.list())
    setContacts(await contactService.list())
    setProducts(await productService.list())
  }, [])

  useEffect(() => { load() }, [load])

  const totalIngresos = MONTHLY_REVENUE.reduce((s, r) => s + r.ingresos, 0)
  const totalGastos = MONTHLY_REVENUE.reduce((s, r) => s + r.gastos, 0)
  const totalFacturas = MONTHLY_REVENUE.reduce((s, r) => s + r.facturas, 0)
  const ganancia = totalIngresos - totalGastos
  const maxVal = Math.max(...MONTHLY_REVENUE.map(r => r.ingresos))

  return (
    <div className="space-y-6">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold" style={{color: 'var(--text-primary)'}}>
          Informes
        </motion.h1>
        <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={() => navigate('/paper-settings')}
          style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-muted)',fontSize:12,cursor:'pointer'}}>
          <FiSettings size={14} /> Formatos de Papel
        </motion.button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={FiDollarSign} label="Ingresos Totales" value={`$${(totalIngresos/1000).toFixed(0)}K`} sub="Últimos 6 meses" />
        <KpiCard icon={FiTrendingUp} label="Ganancia Neta" value={`$${(ganancia/1000).toFixed(0)}K`} sub={`${((ganancia/totalIngresos)*100).toFixed(0)}% margen`} />
        <KpiCard icon={FiFileText} label="Facturas Emitidas" value={totalFacturas.toString()} sub={`${invoices.filter(i => i.status === 'pagada' || i.status === 'paid').length} pagadas`} />
        <KpiCard icon={FiUsers} label="Clientes Activos" value={contacts.filter(c => c.stage === 'cliente').length.toString()} sub={`${contacts.length} contactos total`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{background: 'var(--bg-card)', border: '1px solid var(--border)'}}>
          <h3 className="text-sm font-semibold mb-4" style={{color: 'var(--text-primary)'}}>Evolución de Ingresos vs Gastos</h3>
          <div className="flex items-end gap-2 h-40" style={{borderBottom: '1px solid var(--border)'}}>
            {MONTHLY_REVENUE.map((r, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex gap-0.5 items-end justify-center">
                  <div className="w-3 rounded-t-sm transition-all hover:opacity-80"
                    style={{
                      height: `${(r.ingresos / maxVal) * 100}%`,
                      background: 'var(--accent-gradient)',
                    }} />
                  <div className="w-3 rounded-t-sm transition-all hover:opacity-80"
                    style={{
                      height: `${(r.gastos / maxVal) * 100}%`,
                      background: 'var(--text-muted)',
                      opacity: 0.4,
                    }} />
                </div>
                <span className="text-[10px] mt-1" style={{color: 'var(--text-muted)'}}>{r.month}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs" style={{color: 'var(--text-muted)'}}>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{background: 'var(--accent)'}} />
              Ingresos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{background: 'var(--text-muted)', opacity: 0.4}} />
              Gastos
            </span>
          </div>
        </div>

        <div className="rounded-xl p-5" style={{background: 'var(--bg-card)', border: '1px solid var(--border)'}}>
          <h3 className="text-sm font-semibold mb-4" style={{color: 'var(--text-primary)'}}>Distribución de Facturas</h3>
          <div className="space-y-3">
            {[
              { status: 'pagada', label: 'Pagadas', color: 'var(--success)' },
              { status: 'paid', label: 'Pagadas', color: 'var(--success)' },
              { status: 'pendiente', label: 'Pendientes', color: 'var(--accent)' },
              { status: 'pending', label: 'Pendientes', color: 'var(--accent)' },
              { status: 'vencida', label: 'Vencidas', color: 'var(--danger)' },
              { status: 'overdue', label: 'Vencidas', color: 'var(--danger)' },
            ].map(({ status, label, color }) => {
              const count = invoices.filter(i => i.status === status).length
              const pct = invoices.length ? (count / invoices.length) * 100 : 0
              return (
                <div key={status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{color: 'var(--text-primary)'}}>{label}</span>
                    <span style={{color: 'var(--text-muted)'}}>{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 rounded-full" style={{background: 'var(--bg-secondary)'}}>
                    <div className="h-full rounded-full transition-all" style={{width: `${pct}%`, background: color}} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{background: 'var(--bg-card)', border: '1px solid var(--border)'}}>
        <div className="p-4" style={{borderBottom: '1px solid var(--border)'}}>
          <h3 className="text-sm font-semibold" style={{color: 'var(--text-primary)'}}>
            Productos Más Vendidos
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{borderBottom: '1px solid var(--border)'}}>
                {['Producto', 'Categoría', 'Precio', 'Stock', 'Ventas', 'Ingreso Total'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider"
                    style={{color: 'var(--text-muted)'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...products].sort((a, b) => (b.sales || 0) - (a.sales || 0)).map((p, i) => (
                <tr key={i} style={{borderBottom: '1px solid var(--border)'}}>
                  <td className="px-4 py-3 font-medium" style={{color: 'var(--text-primary)'}}>{p.name}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{background: 'var(--accent-subtle)', color: 'var(--accent)'}}>{p.category}</span>
                  </td>
                  <td className="px-4 py-3" style={{color: 'var(--text-secondary)'}}>${p.price.toLocaleString()}</td>
                  <td className="px-4 py-3" style={{color: p.stock < 5 ? 'var(--danger)' : 'var(--text-secondary)'}}>
                    {p.stock} {p.stock < 5 && '⚠️'}
                  </td>
                  <td className="px-4 py-3" style={{color: 'var(--text-primary)'}}>{p.sales}</td>
                  <td className="px-4 py-3 font-medium" style={{color: 'var(--accent)'}}>
                    ${(p.price * p.sales).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{background: 'var(--bg-card)', border: '1px solid var(--border)'}}>
          <h3 className="text-sm font-semibold mb-4" style={{color: 'var(--text-primary)'}}>Resumen Mensual</h3>
          <div className="space-y-2">
            {MONTHLY_REVENUE.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2" style={{borderBottom: '1px solid var(--border-light)'}}>
                <span className="text-sm font-medium" style={{color: 'var(--text-primary)'}}>{r.month}</span>
                <div className="text-right">
                  <span className="text-sm" style={{color: 'var(--success)'}}>+${(r.ingresos/1000).toFixed(0)}K</span>
                  <span className="text-xs ml-2" style={{color: 'var(--text-muted)'}}>${(r.gastos/1000).toFixed(0)}K gastos</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-5" style={{background: 'var(--bg-card)', border: '1px solid var(--border)'}}>
          <h3 className="text-sm font-semibold mb-4" style={{color: 'var(--text-primary)'}}>
            Rendimiento General
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Crecimiento de Ingresos', value: 90, color: 'var(--accent)' },
              { label: 'Eficiencia Operativa', value: 75, color: 'var(--success)' },
              { label: 'Retención de Clientes', value: 85, color: 'var(--accent)' },
              { label: 'Cumplimiento de Metas', value: 70, color: 'var(--warning)' },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{color: 'var(--text-primary)'}}>{item.label}</span>
                  <span style={{color: 'var(--text-muted)'}}>{item.value}%</span>
                </div>
                <div className="h-2 rounded-full" style={{background: 'var(--bg-secondary)'}}>
                  <div className="h-full rounded-full transition-all" style={{width: `${item.value}%`, background: item.color}} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

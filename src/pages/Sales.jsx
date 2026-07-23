import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FiTrendingUp, FiPackage, FiDollarSign, FiBarChart2, FiSearch } from 'react-icons/fi'
import { productService } from '../services/entityService'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } }
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 }
}

const formatCurrency = (n) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 0 }).format(n)

const StockBadge = ({ stock }) => {
  const color = stock > 20 ? 'success' : stock >= 10 ? 'warning' : 'danger'
  const palette = {
    success: { background: 'var(--success)', color: 'white' },
    warning: { background: 'var(--warning)', color: 'white' },
    danger: { background: 'var(--danger)', color: 'white' },
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 500,
        lineHeight: '18px',
        ...palette[color],
      }}
    >
      {stock}
    </span>
  )
}

export default function Sales() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setProducts(await productService.list())
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const totalProductos = filtered.length
  const totalVentas = filtered.reduce((s, p) => s + p.sales, 0)
  const ingresos = filtered.reduce((s, p) => s + p.price * p.sales, 0)
  const stockBajo = filtered.filter((p) => p.stock < 10).length

  const stats = [
    { label: 'Total Productos', value: totalProductos, icon: FiPackage },
    { label: 'Total Ventas', value: totalVentas, icon: FiTrendingUp },
    { label: 'Ingresos Totales', value: formatCurrency(ingresos), icon: FiDollarSign },
    { label: 'Stock Bajo', value: stockBajo, icon: FiBarChart2 },
  ]

  if (loading) return (<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><div className="spinner" /></div>)

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      <motion.div variants={item}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Ventas Online</h1>
        <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Resumen de ventas y stock de productos</p>
      </motion.div>

      <motion.div variants={item} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
          <FiSearch
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              width: '16px',
              height: '16px',
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto por nombre..."
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid var(--border)',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: 'var(--bg-elevated)',
                color: 'var(--accent)',
              }}
            >
              <s.icon style={{ width: '24px', height: '24px' }} />
            </div>
            <div>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>{s.label}</p>
              <p style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {s.value}
              </p>
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div
        variants={item}
        style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)' }}>
                {['Producto', 'Precio', 'Stock', 'Ventas', 'Ingresos'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '12px 24px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <motion.tr
                  key={p.id}
                  variants={item}
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <td
                    style={{
                      padding: '16px 24px',
                      whiteSpace: 'nowrap',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {p.name}
                  </td>
                  <td
                    style={{
                      padding: '16px 24px',
                      whiteSpace: 'nowrap',
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {formatCurrency(p.price)}
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    <StockBadge stock={p.stock} />
                  </td>
                  <td
                    style={{
                      padding: '16px 24px',
                      whiteSpace: 'nowrap',
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {p.sales}
                  </td>
                  <td
                    style={{
                      padding: '16px 24px',
                      whiteSpace: 'nowrap',
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {formatCurrency(p.price * p.sales)}
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: '32px 24px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '14px',
                    }}
                  >
                    No se encontraron productos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}

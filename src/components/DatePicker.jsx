import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronLeft, FiChevronRight, FiCalendar } from 'react-icons/fi'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAYS = ['Do','Lu','Ma','Mi','Ju','Vi','Sá']

function fmt(val) { return val < 10 ? '0' + val : '' + val }

export default function DatePicker({ value, onChange, label, required, style: customStyle }) {
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(() => value ? new Date(value).getFullYear() : new Date().getFullYear())
  const [month, setMonth] = useState(() => value ? new Date(value).getMonth() : new Date().getMonth())
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const selected = value ? new Date(value) : null

  function selectDay(day) {
    const d = new Date(year, month, day)
    onChange(fmt(d.getFullYear()) + '-' + fmt(d.getMonth() + 1) + '-' + fmt(day))
    setOpen(false)
  }

  function prev() { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  function next() { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const display = value ? (() => { const d = new Date(value + 'T12:00:00'); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` })() : ''

  return (
    <div ref={ref} style={{ position: 'relative', ...customStyle }}>
      {label && (
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 4 }}>
          {label}{required && <span style={{ color: 'var(--danger)' }}>*</span>}
        </label>
      )}
      <div onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', color: value ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 13, transition: 'border-color 0.2s' }}>
        <FiCalendar size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{display || 'Seleccionar fecha'}</span>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }}
            style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, marginTop: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, minWidth: 280, boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <button onClick={prev} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <FiChevronLeft size={14} />
              </button>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <select value={month} onChange={e => setMonth(Number(e.target.value))}
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 6px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                  {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
                <select value={year} onChange={e => setYear(Number(e.target.value))}
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 6px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                  {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button onClick={next} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <FiChevronRight size={14} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
              {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', padding: '4px 0' }}>{d}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {Array.from({ length: firstDay }, (_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1
                const isSelected = selected && selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === day
                const isToday = new Date().getFullYear() === year && new Date().getMonth() === month && new Date().getDate() === day
                return (
                  <button key={day} onClick={() => selectDay(day)}
                    style={{ width: 36, height: 34, borderRadius: 8, border: 'none', fontSize: 13, cursor: 'pointer', fontWeight: isSelected ? 700 : 400,
                      background: isSelected ? 'var(--accent)' : isToday ? 'var(--accent-subtle)' : 'transparent',
                      color: isSelected ? '#fff' : isToday ? 'var(--accent)' : 'var(--text-primary)',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = 'var(--bg-elevated)' } }}
                    onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = isToday ? 'var(--accent-subtle)' : 'transparent' } }}>
                    {day}
                  </button>
                )
              })}
            </div>
            <div style={{ marginTop: 10, textAlign: 'center' }}>
              <button onClick={() => { const d = new Date(); selectDay(d.getDate()); setYear(d.getFullYear()); setMonth(d.getMonth()) }}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                Hoy
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

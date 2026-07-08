import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiUserCheck, FiPlus, FiX, FiDollarSign, FiCalendar, FiSearch } from 'react-icons/fi'
import { EMPLOYEES } from '../data/seed'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const rowItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export default function HR() {
  const [employees, setEmployees] = useState(EMPLOYEES)
  const [modalOpen, setModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [form, setForm] = useState({ name: '', department: '', position: '', salary: '', hireDate: '' })

  const filtered = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalSalary = employees.reduce((s, e) => s + e.salary, 0)
  const departments = [...new Set(employees.map((e) => e.department))].length

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.department || !form.position || !form.salary || !form.hireDate) return
    setEmployees((prev) => [
      { name: form.name, department: form.department, position: form.position, salary: Number(form.salary), hireDate: form.hireDate },
      ...prev,
    ])
    setForm({ name: '', department: '', position: '', salary: '', hireDate: '' })
    setModalOpen(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      padding: '32px 40px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 32,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FiUserCheck style={{ color: 'var(--accent)', fontSize: 28 }} />
              <h1 style={{
                color: 'var(--text-primary)',
                fontSize: 28,
                fontWeight: 700,
                margin: 0,
                letterSpacing: '-0.3px',
              }}>RRHH</h1>
            </div>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: 14,
              margin: '6px 0 0 40px',
            }}>Gestiona los empleados de tu empresa</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              background: 'var(--accent-gradient)',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <FiPlus size={18} />
            Añadir Empleado
          </motion.button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 32,
        }}>
          {[
            { label: 'Total empleados', value: employees.length, color: 'var(--accent)' },
            { label: 'Nómina total', value: totalSalary, color: 'var(--success)' },
            { label: 'Departamentos', value: departments, color: 'var(--warning)' },
          ].map((item) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: '20px 24px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 14,
              }}
            >
              <span style={{
                color: 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>{item.label}</span>
              <span style={{
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: '-0.5px',
                color: item.color,
              }}>
                {item.label === 'Nómina total'
                  ? `$${item.value.toLocaleString('es-DO')}`
                  : item.value}
              </span>
            </motion.div>
          ))}
        </div>

        <div style={{ position: 'relative', marginBottom: 16 }}>
          <FiSearch style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            fontSize: 18,
            pointerEvents: 'none',
          }} />
          <input
            placeholder="Buscar por nombre, departamento o cargo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '13px 14px 13px 44px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          overflow: 'hidden',
        }}>
          <motion.table style={{ width: '100%', borderCollapse: 'collapse' }} variants={container} initial="hidden" animate="show">
            <thead>
              <tr>
                {['Nombre', 'Departamento', 'Cargo', 'Salario', 'Fecha Contratación'].map((h) => (
                  <th key={h} style={{
                    textAlign: 'left',
                    padding: '14px 20px',
                    color: 'var(--text-muted)',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filtered.map((emp) => (
                  <motion.tr
                    key={emp.name}
                    variants={rowItem}
                    layout
                    exit={{ opacity: 0, y: -8 }}
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{
                      padding: '14px 20px',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      fontWeight: 600,
                    }}>{emp.name}</td>
                    <td style={{
                      padding: '14px 20px',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                    }}>{emp.department}</td>
                    <td style={{
                      padding: '14px 20px',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                    }}>{emp.position}</td>
                    <td style={{
                      padding: '14px 20px',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                    }}>
                      <FiDollarSign size={14} style={{ marginRight: 6, color: 'var(--text-muted)', flexShrink: 0 }} />
                      ${emp.salary.toLocaleString('es-DO')}
                    </td>
                    <td style={{
                      padding: '14px 20px',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                    }}>
                      <FiCalendar size={14} style={{ marginRight: 8, color: 'var(--text-muted)', flexShrink: 0 }} />
                      {emp.hireDate}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </motion.table>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 460,
                padding: '32px 36px 36px',
                background: 'var(--bg-card)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                boxShadow: '0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 28,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FiUserCheck style={{ color: 'var(--accent)', fontSize: 22 }} />
                  <h2 style={{
                    color: 'var(--text-primary)',
                    fontSize: 20,
                    fontWeight: 700,
                    margin: 0,
                  }}>Añadir Empleado</h2>
                </div>
                <motion.button
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setModalOpen(false)}
                  style={{
                    display: 'flex',
                    padding: 8,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <FiX size={20} />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>Nombre</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <FiUserCheck style={{
                      position: 'absolute',
                      left: 14,
                      color: 'var(--text-muted)',
                      fontSize: 18,
                      pointerEvents: 'none',
                    }} />
                    <input
                      name="name"
                      placeholder="Nombre completo"
                      value={form.name}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '13px 14px 13px 44px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        color: 'var(--text-primary)',
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      autoFocus
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>Departamento</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      name="department"
                      placeholder="Ej: Ventas, TI, RRHH"
                      value={form.department}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '13px 14px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        color: 'var(--text-primary)',
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>Cargo</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      name="position"
                      placeholder="Ej: Desarrollador Senior"
                      value={form.position}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '13px 14px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        color: 'var(--text-primary)',
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>Salario (RD$)</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <FiDollarSign style={{
                      position: 'absolute',
                      left: 14,
                      color: 'var(--text-muted)',
                      fontSize: 18,
                      pointerEvents: 'none',
                    }} />
                    <input
                      name="salary"
                      type="number"
                      placeholder="0"
                      value={form.salary}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '13px 14px 13px 44px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        color: 'var(--text-primary)',
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>Fecha de Contratación</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <FiCalendar style={{
                      position: 'absolute',
                      left: 14,
                      color: 'var(--text-muted)',
                      fontSize: 18,
                      pointerEvents: 'none',
                    }} />
                    <input
                      name="hireDate"
                      type="date"
                      value={form.hireDate}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '13px 14px 13px 44px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        color: 'var(--text-primary)',
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '14px 0',
                    background: 'var(--accent-gradient)',
                    border: 'none',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: 4,
                  }}
                >
                  <FiPlus size={18} />
                  Añadir Empleado
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
